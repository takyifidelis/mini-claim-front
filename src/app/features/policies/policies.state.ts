import { inject, Injectable } from '@angular/core';
import { Action, Selector, State, StateContext } from '@ngxs/store';
import { catchError, tap, throwError } from 'rxjs';
import { PoliciesApiService } from '../../core/api/policies-api.service';
import { RiskCoversApiService } from '../../core/api/risk-covers-api.service';
import {
  CreatePolicyDto,
  PaginatedFeatureState,
  PolicyDetail,
  PolicyFilters,
  PolicySummary,
  QueryPoliciesDto,
  RiskCover,
} from '../../shared/models';

/**
 * NGXS state model for the Policies feature.
 *
 * Extends the generic paginated state with a selected policy detail,
 * lightweight option lists for form selectors, and a `mutating` flag.
 */
export interface PoliciesStateModel extends PaginatedFeatureState<PolicySummary, PolicyFilters> {
  /** The policy loaded for the detail view, or `null` when none is selected. */
  selectedPolicy: PolicyDetail | null;
  /** Flat list of policy summaries used to populate claim-form selectors. */
  selectablePolicies: PolicySummary[];
  /** Flat list of active risk covers used to populate policy-form cover selectors. */
  selectableRiskCovers: RiskCover[];
  /** `true` while a create mutation is in flight. */
  mutating: boolean;
}

/** Triggers loading of the paginated policies list. */
export class LoadPolicies {
  static readonly type = '[Policies] Load List';
}

/** Loads full policy detail (including covers and exchange rate sheet) into `selectedPolicy`. */
export class LoadPolicyDetail {
  static readonly type = '[Policies] Load Detail';
  constructor(public readonly id: string) {}
}

/** Fetches all active policies into `selectablePolicies` for use in claim-form dropdowns. */
export class LoadSelectablePolicies {
  static readonly type = '[Policies] Load Selectable Policies';
}

/** Fetches all active risk covers into `selectableRiskCovers` for use in policy-form dropdowns. */
export class LoadSelectableRiskCovers {
  static readonly type = '[Policies] Load Selectable Risk Covers';
}

/** Creates a new policy with its risk cover lines. */
export class CreatePolicy {
  static readonly type = '[Policies] Create';
  constructor(public readonly dto: CreatePolicyDto) {}
}

/** Updates the current page and page size, then reloads the list. */
export class SetPoliciesPage {
  static readonly type = '[Policies] Set Page';
  constructor(
    public readonly page: number,
    public readonly pageSize: number,
    public readonly sortField?: string | null,
    public readonly sortDirection?: 'asc' | 'desc' | null,
  ) {}
}

/** Merges partial filter values into the active filter set and reloads from page 1. */
export class SetPoliciesFilter {
  static readonly type = '[Policies] Set Filter';
  constructor(public readonly filters: Partial<PolicyFilters>) {}
}

/** Resets all filters to their default values and reloads from page 1. */
export class ClearPoliciesFilter {
  static readonly type = '[Policies] Clear Filter';
}

/** Updates the active sort field and direction, then reloads from page 1. */
export class SetPoliciesSort {
  static readonly type = '[Policies] Set Sort';
  constructor(
    public readonly sortField: string | null,
    public readonly sortDirection: 'asc' | 'desc' | null,
  ) {}
}

const DEFAULT_STATE: PoliciesStateModel = {
  items: [],
  total: 0,
  page: 1,
  pageSize: 10,
  sortField: 'createdAt',
  sortDirection: 'desc',
  filters: {
    currency: null,
    status: null,
    search: '',
  },
  loading: false,
  error: null,
  selectedPolicy: null,
  selectablePolicies: [],
  selectableRiskCovers: [],
  mutating: false,
};

/**
 * NGXS state class for the Policies feature module.
 *
 * Manages the paginated policies list, a detail view policy, and two
 * lightweight option arrays used by claim and policy creation forms.
 */
@State<PoliciesStateModel>({
  name: 'policies',
  defaults: DEFAULT_STATE,
})
@Injectable()
export class PoliciesState {
  private readonly api = inject(PoliciesApiService);
  private readonly riskCoversApi = inject(RiskCoversApiService);

  @Selector()
  static items(state: PoliciesStateModel): PolicySummary[] {
    return state.items;
  }

  @Selector()
  static total(state: PoliciesStateModel): number {
    return state.total;
  }

  @Selector()
  static page(state: PoliciesStateModel): number {
    return state.page;
  }

  @Selector()
  static pageSize(state: PoliciesStateModel): number {
    return state.pageSize;
  }

  @Selector()
  static loading(state: PoliciesStateModel): boolean {
    return state.loading;
  }

  @Selector()
  static error(state: PoliciesStateModel): string | null {
    return state.error;
  }

  @Selector()
  static selectedPolicy(state: PoliciesStateModel): PolicyDetail | null {
    return state.selectedPolicy;
  }

  @Selector()
  static selectablePolicies(state: PoliciesStateModel): PolicySummary[] {
    return state.selectablePolicies;
  }

  @Selector()
  static selectableRiskCovers(state: PoliciesStateModel): RiskCover[] {
    return state.selectableRiskCovers;
  }

  @Selector()
  static filters(state: PoliciesStateModel): PolicyFilters {
    return state.filters;
  }

  @Selector()
  static mutating(state: PoliciesStateModel): boolean {
    return state.mutating;
  }

  @Action(LoadPolicies, { cancelUncompleted: true })
  loadPolicies(ctx: StateContext<PoliciesStateModel>) {
    const state = ctx.getState();
    ctx.patchState({ loading: true, error: null });

    const query: QueryPoliciesDto = {
      page: state.page,
      pageSize: state.pageSize,
      sortBy: state.sortField || undefined,
      sortDirection: state.sortDirection || undefined,
      search: state.filters.search || undefined,
      currency: state.filters.currency || undefined,
      status: state.filters.status || undefined,
    };

    return this.api.getAll(query).pipe(
      tap((res) => {
        ctx.patchState({
          items: res.items,
          total: res.totalItems,
          loading: false,
          error: null,
        });
      }),
      catchError((err) => {
        ctx.patchState({
          loading: false,
          error: err?.message || 'Failed to load policies.',
        });
        return throwError(() => err);
      }),
    );
  }

  @Action(LoadSelectableRiskCovers)
  loadSelectableRiskCovers(ctx: StateContext<PoliciesStateModel>) {
    return this.riskCoversApi.getOptions().pipe(
      tap((selectableRiskCovers) => {
        ctx.patchState({ selectableRiskCovers });
      }),
      catchError((err) => {
        return throwError(() => err);
      }),
    );
  }

  @Action(LoadSelectablePolicies, { cancelUncompleted: true })
  loadSelectablePolicies(ctx: StateContext<PoliciesStateModel>) {
    return this.api.getOptions().pipe(
      tap((selectablePolicies) => {
        ctx.patchState({ selectablePolicies });
      }),
      catchError((err) => throwError(() => err)),
    );
  }

  @Action(LoadPolicyDetail)
  loadPolicyDetail(ctx: StateContext<PoliciesStateModel>, action: LoadPolicyDetail) {
    ctx.patchState({ loading: true, error: null });
    return this.api.getById(action.id).pipe(
      tap((selectedPolicy) => {
        ctx.patchState({
          selectedPolicy,
          loading: false,
          error: null,
        });
      }),
      catchError((err) => {
        ctx.patchState({
          loading: false,
          error: err?.message || 'Failed to load policy details.',
        });
        return throwError(() => err);
      }),
    );
  }

  @Action(CreatePolicy)
  createPolicy(ctx: StateContext<PoliciesStateModel>, action: CreatePolicy) {
    ctx.patchState({ mutating: true, error: null });
    return this.api.create(action.dto).pipe(
      tap((created) => {
        ctx.patchState({
          selectedPolicy: created,
          mutating: false,
        });
        ctx.dispatch(new LoadPolicies());
      }),
      catchError((err) => {
        ctx.patchState({ mutating: false, error: err?.message || 'Failed to create policy.' });
        return throwError(() => err);
      }),
    );
  }

  @Action(SetPoliciesPage)
  setPage(ctx: StateContext<PoliciesStateModel>, action: SetPoliciesPage) {
    ctx.patchState({
      page: action.page,
      pageSize: action.pageSize,
      ...(action.sortField !== undefined
        ? { sortField: action.sortField, sortDirection: action.sortDirection ?? null }
        : {}),
    });
    return ctx.dispatch(new LoadPolicies());
  }

  @Action(SetPoliciesFilter)
  setFilter(ctx: StateContext<PoliciesStateModel>, action: SetPoliciesFilter) {
    const state = ctx.getState();
    ctx.patchState({
      filters: { ...state.filters, ...action.filters },
      page: 1,
    });
    return ctx.dispatch(new LoadPolicies());
  }

  @Action(ClearPoliciesFilter)
  clearFilter(ctx: StateContext<PoliciesStateModel>) {
    ctx.patchState({
      filters: { currency: null, status: null, search: '' },
      page: 1,
    });
    return ctx.dispatch(new LoadPolicies());
  }

  @Action(SetPoliciesSort)
  setSort(ctx: StateContext<PoliciesStateModel>, action: SetPoliciesSort) {
    ctx.patchState({
      sortField: action.sortField,
      sortDirection: action.sortDirection,
      page: 1,
    });
    return ctx.dispatch(new LoadPolicies());
  }
}
