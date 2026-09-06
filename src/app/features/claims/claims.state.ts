import { inject, Injectable } from '@angular/core';
import { Action, Selector, State, StateContext } from '@ngxs/store';
import { catchError, tap, throwError } from 'rxjs';
import { ClaimsApiService } from '../../core/api/claims-api.service';
import { ClaimPaymentsApiService } from '../../core/api/claim-payments-api.service';
import { ExchangeRatesApiService } from '../../core/api/exchange-rates-api.service';
import { PoliciesApiService } from '../../core/api/policies-api.service';
import {
  ClaimDetail,
  ClaimFilters,
  ClaimPayment,
  ClaimSummary,
  ClearApprovedPayoutDto,
  CreateClaimDto,
  CreateClaimPaymentDto,
  CreateClaimReviewDto,
  CurrencyTotals,
  ExchangeRateSheetDetail,
  PaginatedFeatureState,
  PolicyDetail,
  QueryClaimsDto,
  QueryClaimPaymentsDto,
  UpdateApprovedPayoutDto,
  UpdateClaimDto,
} from '../../shared/models';

/**
 * NGXS state model for the Claims feature.
 *
 * Extends the generic paginated state with per-currency monetary aggregates,
 * the selected claim detail, the policy and exchange rate data locked at claim
 * creation, a paginated payments sub-list, and separate action/mutation flags.
 */
export interface ClaimsStateModel extends PaginatedFeatureState<ClaimSummary, ClaimFilters> {
  /** Per-currency monetary aggregates for the current filtered set of claims. */
  totalsByCurrency: CurrencyTotals[];
  /** The claim loaded for the detail/workflow view. */
  selectedClaim: ClaimDetail | null;
  /** The policy associated with `selectedClaim`, loaded for coverage context. */
  selectedPolicy: PolicyDetail | null;
  /** The exchange rate sheet locked to the policy at creation time. */
  lockedExchangeRate: ExchangeRateSheetDetail | null;
  /** Payments recorded against `selectedClaim`, current page. */
  payments: ClaimPayment[];
  /** Total payment records across all pages for `selectedClaim`. */
  paymentsTotal: number;
  /** Current page number of the payments sub-list. */
  paymentsPage: number;
  /** Page size of the payments sub-list. */
  paymentsPageSize: number;
  /** `true` while a payments list request is in flight. */
  paymentsLoading: boolean;
  /** `true` while a workflow action (review, payout, payment) is in flight. */
  actionLoading: boolean;
  /** `true` while a create mutation is in flight. */
  mutating: boolean;
}

/** Triggers loading of the paginated claims list with per-currency totals. */
export class LoadClaims {
  static readonly type = '[Claims] Load List';
}

/** Updates pagination and optional sorting in one transition, then reloads the list once. */
export class SetClaimsPage {
  static readonly type = '[Claims] Set Page';
  constructor(
    public readonly page: number,
    public readonly pageSize: number,
    public readonly sortField?: string | null,
    public readonly sortDirection?: 'asc' | 'desc' | null,
  ) {}
}

/** Merges partial filter values into the active filter set and reloads from page 1. */
export class SetClaimsFilter {
  static readonly type = '[Claims] Set Filter';
  constructor(public readonly filters: Partial<ClaimFilters>) {}
}

/**
 * Resets all filters to defaults and optionally applies a status pre-filter.
 *
 * Used by list variants (review, payout, settlement) to pre-scope the list
 * to a specific workflow status.
 */
export class ClearClaimsFilter {
  static readonly type = '[Claims] Clear Filter';
  constructor(public readonly filters: Partial<ClaimFilters> = {}) {}
}

/** Updates the active sort field and direction, then reloads from page 1. */
export class SetClaimsSort {
  static readonly type = '[Claims] Set Sort';
  constructor(
    public readonly sortField: string | null,
    public readonly sortDirection: 'asc' | 'desc' | null,
  ) {}
}

/**
 * Loads full claim detail and side-loads the associated policy and locked
 * exchange rate sheet for the workflow panel.
 */
export class LoadClaimDetail {
  static readonly type = '[Claims] Load Detail';
  constructor(public readonly id: string) {}
}

/** Clears the selected claim and all related side-loaded data. */
export class ClearSelectedClaim {
  static readonly type = '[Claims] Clear Selected';
}

/** Registers a new claim against a policy risk cover. */
export class CreateClaim {
  static readonly type = '[Claims] Create';
  constructor(public readonly dto: CreateClaimDto) {}
}

/** Updates mutable claim facts; only allowed while the claim is `UNDER_REVIEW`. */
export class UpdateClaimFacts {
  static readonly type = '[Claims] Update Facts';
  constructor(
    public readonly id: string,
    public readonly dto: UpdateClaimDto,
  ) {}
}

/** Submits an APPROVED or DENIED review decision for a claim. */
export class SubmitClaimReview {
  static readonly type = '[Claims] Submit Review';
  constructor(
    public readonly id: string,
    public readonly dto: CreateClaimReviewDto,
  ) {}
}

/** Sets or updates the approved payout amount for a claim. */
export class SetApprovedPayout {
  static readonly type = '[Claims] Set Approved Payout';
  constructor(
    public readonly id: string,
    public readonly dto: UpdateApprovedPayoutDto,
  ) {}
}

/** Clears the approved payout amount, reverting the claim to `UNDER_REVIEW`. */
export class ClearApprovedPayout {
  static readonly type = '[Claims] Clear Approved Payout';
  constructor(
    public readonly id: string,
    public readonly dto: ClearApprovedPayoutDto,
  ) {}
}

/** Loads a paginated list of payments recorded against a claim. */
export class LoadClaimPayments {
  static readonly type = '[Claims] Load Payments';
  constructor(
    public readonly claimId: string,
    public readonly page = 1,
    public readonly pageSize = 10,
  ) {}
}

/** Records a new payment against a claim and reloads both the claim detail and payments list. */
export class RecordClaimPayment {
  static readonly type = '[Claims] Record Payment';
  constructor(
    public readonly claimId: string,
    public readonly dto: CreateClaimPaymentDto,
  ) {}
}

const DEFAULT_CLAIM_FILTERS: ClaimFilters = {
  search: '',
  dateNotifiedFrom: null,
  dateNotifiedTo: null,
  status: null,
  currency: null,
  policyId: null,
};

const DEFAULT_STATE: ClaimsStateModel = {
  items: [],
  total: 0,
  page: 1,
  pageSize: 10,
  sortField: 'createdAt',
  sortDirection: 'desc',
  filters: { ...DEFAULT_CLAIM_FILTERS },
  totalsByCurrency: [],
  loading: false,
  error: null,
  selectedClaim: null,
  selectedPolicy: null,
  lockedExchangeRate: null,
  payments: [],
  paymentsTotal: 0,
  paymentsPage: 1,
  paymentsPageSize: 10,
  paymentsLoading: false,
  actionLoading: false,
  mutating: false,
};

/**
 * NGXS state class for the Claims feature module.
 *
 * The largest state slice in the application. It manages:
 * - A paginated claims list with per-currency monetary aggregates.
 * - A selected claim detail with side-loaded policy and locked exchange rate.
 * - A paginated payments sub-list for the selected claim.
 * - Separate `loading`, `actionLoading`, and `mutating` flags for granular UI control.
 */
@State<ClaimsStateModel>({
  name: 'claims',
  defaults: DEFAULT_STATE,
})
@Injectable()
export class ClaimsState {
  private readonly api = inject(ClaimsApiService);
  private readonly paymentsApi = inject(ClaimPaymentsApiService);
  private readonly policiesApi = inject(PoliciesApiService);
  private readonly exchangeRatesApi = inject(ExchangeRatesApiService);

  @Selector()
  static items(state: ClaimsStateModel): ClaimSummary[] {
    return state.items;
  }

  @Selector()
  static total(state: ClaimsStateModel): number {
    return state.total;
  }

  @Selector()
  static page(state: ClaimsStateModel): number {
    return state.page;
  }

  @Selector()
  static pageSize(state: ClaimsStateModel): number {
    return state.pageSize;
  }

  @Selector()
  static loading(state: ClaimsStateModel): boolean {
    return state.loading;
  }

  @Selector()
  static error(state: ClaimsStateModel): string | null {
    return state.error;
  }

  @Selector()
  static totalsByCurrency(state: ClaimsStateModel): CurrencyTotals[] {
    return state.totalsByCurrency;
  }

  @Selector()
  static filters(state: ClaimsStateModel): ClaimFilters {
    return state.filters;
  }

  @Selector()
  static selectedClaim(state: ClaimsStateModel): ClaimDetail | null {
    return state.selectedClaim;
  }

  @Selector()
  static selectedPolicy(state: ClaimsStateModel): PolicyDetail | null {
    return state.selectedPolicy;
  }

  @Selector()
  static lockedExchangeRate(state: ClaimsStateModel): ExchangeRateSheetDetail | null {
    return state.lockedExchangeRate;
  }

  @Selector()
  static payments(state: ClaimsStateModel): ClaimPayment[] {
    return state.payments;
  }

  @Selector()
  static paymentsTotal(state: ClaimsStateModel): number {
    return state.paymentsTotal;
  }

  @Selector()
  static paymentsPage(state: ClaimsStateModel): number {
    return state.paymentsPage;
  }

  @Selector()
  static paymentsPageSize(state: ClaimsStateModel): number {
    return state.paymentsPageSize;
  }

  @Selector()
  static paymentsLoading(state: ClaimsStateModel): boolean {
    return state.paymentsLoading;
  }

  @Selector()
  static actionLoading(state: ClaimsStateModel): boolean {
    return state.actionLoading;
  }

  @Selector()
  static mutating(state: ClaimsStateModel): boolean {
    return state.mutating;
  }

  @Action(LoadClaims, { cancelUncompleted: true })
  loadClaims(ctx: StateContext<ClaimsStateModel>) {
    const state = ctx.getState();
    ctx.patchState({ loading: true, error: null });

    const query: QueryClaimsDto = {
      page: state.page,
      pageSize: state.pageSize,
      sortBy: state.sortField || undefined,
      sortDirection: state.sortDirection || undefined,
      search: state.filters.search || undefined,
      status: state.filters.status || undefined,
      currency: state.filters.currency || undefined,
      dateNotifiedFrom: state.filters.dateNotifiedFrom || undefined,
      dateNotifiedTo: state.filters.dateNotifiedTo || undefined,
      policyId: state.filters.policyId || undefined,
    };

    return this.api.getAll(query).pipe(
      tap((res) => {
        ctx.patchState({
          items: res.items,
          total: res.totalItems,
          totalsByCurrency: res.totalsByCurrency || [],
          loading: false,
          error: null,
        });
      }),
      catchError((err) => {
        ctx.patchState({
          loading: false,
          error: err?.message || 'Failed to load claims.',
        });
        return throwError(() => err);
      }),
    );
  }

  @Action(LoadClaimDetail)
  loadClaimDetail(ctx: StateContext<ClaimsStateModel>, action: LoadClaimDetail) {
    ctx.patchState({ loading: true, error: null });
    return this.api.getById(action.id).pipe(
      tap((selectedClaim) => {
        ctx.patchState({
          selectedClaim,
          loading: false,
          error: null,
        });
        // Also fetch payments for this claim
        ctx.dispatch(new LoadClaimPayments(action.id));
        // Fetch policy and locked exchange rate for workflow context
        if (selectedClaim.policyId) {
          this.policiesApi.getById(selectedClaim.policyId).subscribe({
            next: (selectedPolicy) => {
              ctx.patchState({ selectedPolicy });
              if (selectedPolicy.exchangeRateSheetId) {
                this.exchangeRatesApi.getById(selectedPolicy.exchangeRateSheetId).subscribe({
                  next: (lockedExchangeRate) => {
                    ctx.patchState({ lockedExchangeRate });
                  },
                });
              }
            },
          });
        }
      }),
      catchError((err) => {
        ctx.patchState({
          loading: false,
          error: err?.message || 'Failed to load claim details.',
        });
        return throwError(() => err);
      }),
    );
  }

  @Action(ClearSelectedClaim)
  clearSelectedClaim(ctx: StateContext<ClaimsStateModel>) {
    ctx.patchState({
      selectedClaim: null,
      selectedPolicy: null,
      lockedExchangeRate: null,
      payments: [],
      paymentsTotal: 0,
    });
  }

  @Action(CreateClaim)
  createClaim(ctx: StateContext<ClaimsStateModel>, action: CreateClaim) {
    ctx.patchState({ mutating: true, error: null });
    return this.api.create(action.dto).pipe(
      tap((created) => {
        ctx.patchState({
          selectedClaim: created,
          mutating: false,
        });
        ctx.dispatch(new LoadClaims());
      }),
      catchError((err) => {
        ctx.patchState({ mutating: false, error: err?.message || 'Failed to register claim.' });
        return throwError(() => err);
      }),
    );
  }

  @Action(UpdateClaimFacts)
  updateClaimFacts(ctx: StateContext<ClaimsStateModel>, action: UpdateClaimFacts) {
    ctx.patchState({ actionLoading: true, error: null });
    return this.api.update(action.id, action.dto).pipe(
      tap((updated) => {
        ctx.patchState({
          selectedClaim: updated,
          actionLoading: false,
        });
        ctx.dispatch(new LoadClaims());
      }),
      catchError((err) => {
        ctx.patchState({
          actionLoading: false,
          error: err?.message || 'Failed to update claim facts.',
        });
        return throwError(() => err);
      }),
    );
  }

  @Action(SubmitClaimReview)
  submitClaimReview(ctx: StateContext<ClaimsStateModel>, action: SubmitClaimReview) {
    ctx.patchState({ actionLoading: true, error: null });
    return this.api.createReview(action.id, action.dto).pipe(
      tap((updated) => {
        ctx.patchState({
          selectedClaim: updated,
          actionLoading: false,
        });
        ctx.dispatch(new LoadClaims());
      }),
      catchError((err) => {
        ctx.patchState({
          actionLoading: false,
          error: err?.message || 'Failed to submit claim review.',
        });
        return throwError(() => err);
      }),
    );
  }

  @Action(SetApprovedPayout)
  setApprovedPayout(ctx: StateContext<ClaimsStateModel>, action: SetApprovedPayout) {
    ctx.patchState({ actionLoading: true, error: null });
    return this.api.setApprovedPayout(action.id, action.dto).pipe(
      tap((updated) => {
        ctx.patchState({
          selectedClaim: updated,
          actionLoading: false,
        });
        ctx.dispatch(new LoadClaims());
      }),
      catchError((err) => {
        ctx.patchState({
          actionLoading: false,
          error: err?.message || 'Failed to set approved payout.',
        });
        return throwError(() => err);
      }),
    );
  }

  @Action(ClearApprovedPayout)
  clearApprovedPayout(ctx: StateContext<ClaimsStateModel>, action: ClearApprovedPayout) {
    ctx.patchState({ actionLoading: true, error: null });
    return this.api.clearApprovedPayout(action.id, action.dto).pipe(
      tap((updated) => {
        ctx.patchState({
          selectedClaim: updated,
          actionLoading: false,
        });
        ctx.dispatch(new LoadClaims());
      }),
      catchError((err) => {
        ctx.patchState({
          actionLoading: false,
          error: err?.message || 'Failed to clear approved payout.',
        });
        return throwError(() => err);
      }),
    );
  }

  @Action(LoadClaimPayments)
  loadClaimPayments(ctx: StateContext<ClaimsStateModel>, action: LoadClaimPayments) {
    ctx.patchState({ paymentsLoading: true });
    const query: QueryClaimPaymentsDto = {
      page: action.page,
      pageSize: action.pageSize,
    };
    return this.paymentsApi.getAll(action.claimId, query).pipe(
      tap((res) => {
        ctx.patchState({
          payments: res.items,
          paymentsTotal: res.totalItems,
          paymentsPage: res.page,
          paymentsPageSize: res.pageSize,
          paymentsLoading: false,
        });
      }),
      catchError((err) => {
        ctx.patchState({ paymentsLoading: false });
        return throwError(() => err);
      }),
    );
  }

  @Action(RecordClaimPayment)
  recordClaimPayment(ctx: StateContext<ClaimsStateModel>, action: RecordClaimPayment) {
    ctx.patchState({ actionLoading: true, error: null });
    return this.paymentsApi.create(action.claimId, action.dto).pipe(
      tap(() => {
        ctx.patchState({ actionLoading: false });
        // Reload claim details to refresh totalPaid and outstandingBalance
        ctx.dispatch(new LoadClaimDetail(action.claimId));
        ctx.dispatch(new LoadClaimPayments(action.claimId));
        ctx.dispatch(new LoadClaims());
      }),
      catchError((err) => {
        ctx.patchState({
          actionLoading: false,
          error: err?.message || 'Failed to record payment.',
        });
        return throwError(() => err);
      }),
    );
  }

  @Action(SetClaimsPage)
  setPage(ctx: StateContext<ClaimsStateModel>, action: SetClaimsPage) {
    ctx.patchState({
      page: action.page,
      pageSize: action.pageSize,
      ...(action.sortField !== undefined
        ? { sortField: action.sortField, sortDirection: action.sortDirection ?? null }
        : {}),
    });
    return ctx.dispatch(new LoadClaims());
  }

  @Action(SetClaimsFilter)
  setFilter(ctx: StateContext<ClaimsStateModel>, action: SetClaimsFilter) {
    const state = ctx.getState();
    ctx.patchState({
      filters: { ...state.filters, ...action.filters },
      page: 1,
    });
    return ctx.dispatch(new LoadClaims());
  }

  @Action(ClearClaimsFilter)
  clearFilter(ctx: StateContext<ClaimsStateModel>, action: ClearClaimsFilter) {
    ctx.patchState({
      filters: { ...DEFAULT_CLAIM_FILTERS, ...action.filters },
      page: 1,
    });
    return ctx.dispatch(new LoadClaims());
  }

  @Action(SetClaimsSort)
  setSort(ctx: StateContext<ClaimsStateModel>, action: SetClaimsSort) {
    ctx.patchState({
      sortField: action.sortField,
      sortDirection: action.sortDirection,
      page: 1,
    });
    return ctx.dispatch(new LoadClaims());
  }
}
