import { inject, Injectable } from '@angular/core';
import { Action, Selector, State, StateContext } from '@ngxs/store';
import { catchError, tap, throwError } from 'rxjs';
import { ExchangeRatesApiService } from '../../core/api/exchange-rates-api.service';
import {
  CreateExchangeRateSheetDto,
  ExchangeRateFilters,
  ExchangeRateSheetDetail,
  ExchangeRateSheetSummary,
  PaginatedFeatureState,
  QueryExchangeRateSheetsDto,
} from '../../shared/models';

/**
 * NGXS state model for the Exchange Rates feature.
 *
 * Extends the generic paginated state with the currently active sheet
 * (`currentSheet`) used by policy and claim forms, and a separately
 * selected sheet for the detail view.
 */
export interface ExchangeRatesStateModel extends PaginatedFeatureState<
  ExchangeRateSheetSummary,
  ExchangeRateFilters
> {
  /** The most recently effective exchange rate sheet; used in form rate lookups. */
  currentSheet: ExchangeRateSheetDetail | null;
  /** The sheet loaded for the detail view. */
  selectedSheet: ExchangeRateSheetDetail | null;
  /** `true` while a create mutation is in flight. */
  mutating: boolean;
}

/** Triggers loading of the paginated exchange rate sheets list. */
export class LoadExchangeRates {
  static readonly type = '[ExchangeRates] Load List';
}

/** Fetches the currently active exchange rate sheet and stores it in `currentSheet`. */
export class LoadCurrentExchangeRate {
  static readonly type = '[ExchangeRates] Load Current';
}

/** Loads the full detail of a specific exchange rate sheet into `selectedSheet`. */
export class LoadExchangeRateDetail {
  static readonly type = '[ExchangeRates] Load Detail';
  constructor(public readonly id: string) {}
}

/** Creates a new exchange rate sheet and immediately activates it as `currentSheet`. */
export class CreateExchangeRate {
  static readonly type = '[ExchangeRates] Create';
  constructor(public readonly dto: CreateExchangeRateSheetDto) {}
}

/** Updates the current page and page size, then reloads the list. */
export class SetExchangeRatesPage {
  static readonly type = '[ExchangeRates] Set Page';
  constructor(
    public readonly page: number,
    public readonly pageSize: number,
    public readonly sortField?: string | null,
    public readonly sortDirection?: 'asc' | 'desc' | null,
  ) {}
}

/** Merges partial filter values into the active filter set and reloads from page 1. */
export class SetExchangeRatesFilter {
  static readonly type = '[ExchangeRates] Set Filter';
  constructor(public readonly filters: Partial<ExchangeRateFilters>) {}
}

/** Resets all filters to their default values and reloads from page 1. */
export class ClearExchangeRatesFilter {
  static readonly type = '[ExchangeRates] Clear Filter';
}

/** Updates the active sort field and direction, then reloads from page 1. */
export class SetExchangeRatesSort {
  static readonly type = '[ExchangeRates] Set Sort';
  constructor(
    public readonly sortField: string | null,
    public readonly sortDirection: 'asc' | 'desc' | null,
  ) {}
}

const DEFAULT_STATE: ExchangeRatesStateModel = {
  items: [],
  total: 0,
  page: 1,
  pageSize: 10,
  sortField: 'effectiveAt',
  sortDirection: 'desc',
  filters: {
    search: '',
  },
  loading: false,
  error: null,
  currentSheet: null,
  selectedSheet: null,
  mutating: false,
};

/**
 * NGXS state class for the Exchange Rates feature module.
 *
 * Manages a paginated list of exchange rate sheet summaries, the currently
 * active sheet used by other features, and a detail view sheet.  All list
 * actions cancel in-flight requests when superseded (NGXS `cancelUncompleted`).
 */
@State<ExchangeRatesStateModel>({
  name: 'exchangeRates',
  defaults: DEFAULT_STATE,
})
@Injectable()
export class ExchangeRatesState {
  private readonly api = inject(ExchangeRatesApiService);

  @Selector()
  static items(state: ExchangeRatesStateModel): ExchangeRateSheetSummary[] {
    return state.items;
  }

  @Selector()
  static total(state: ExchangeRatesStateModel): number {
    return state.total;
  }

  @Selector()
  static page(state: ExchangeRatesStateModel): number {
    return state.page;
  }

  @Selector()
  static pageSize(state: ExchangeRatesStateModel): number {
    return state.pageSize;
  }

  @Selector()
  static loading(state: ExchangeRatesStateModel): boolean {
    return state.loading;
  }

  @Selector()
  static error(state: ExchangeRatesStateModel): string | null {
    return state.error;
  }

  @Selector()
  static currentSheet(state: ExchangeRatesStateModel): ExchangeRateSheetDetail | null {
    return state.currentSheet;
  }

  @Selector()
  static selectedSheet(state: ExchangeRatesStateModel): ExchangeRateSheetDetail | null {
    return state.selectedSheet;
  }

  @Selector()
  static filters(state: ExchangeRatesStateModel): ExchangeRateFilters {
    return state.filters;
  }

  @Selector()
  static mutating(state: ExchangeRatesStateModel): boolean {
    return state.mutating;
  }

  @Action(LoadExchangeRates, { cancelUncompleted: true })
  loadExchangeRates(ctx: StateContext<ExchangeRatesStateModel>) {
    const state = ctx.getState();
    ctx.patchState({ loading: true, error: null });

    const query: QueryExchangeRateSheetsDto = {
      page: state.page,
      pageSize: state.pageSize,
      sortBy: state.sortField || undefined,
      sortDirection: state.sortDirection || undefined,
      search: state.filters.search || undefined,
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
          error: err?.message || 'Failed to load exchange rate sheets.',
        });
        return throwError(() => err);
      }),
    );
  }

  @Action(LoadCurrentExchangeRate)
  loadCurrentExchangeRate(ctx: StateContext<ExchangeRatesStateModel>) {
    return this.api.getCurrent().pipe(
      tap((currentSheet) => {
        ctx.patchState({ currentSheet, error: null });
      }),
      catchError((err) => {
        ctx.patchState({ currentSheet: null });
        return throwError(() => err);
      }),
    );
  }

  @Action(LoadExchangeRateDetail)
  loadExchangeRateDetail(
    ctx: StateContext<ExchangeRatesStateModel>,
    action: LoadExchangeRateDetail,
  ) {
    ctx.patchState({ loading: true, error: null });
    return this.api.getById(action.id).pipe(
      tap((selectedSheet) => {
        ctx.patchState({
          selectedSheet,
          loading: false,
          error: null,
        });
      }),
      catchError((err) => {
        ctx.patchState({
          loading: false,
          error: err?.message || 'Failed to load exchange rate details.',
        });
        return throwError(() => err);
      }),
    );
  }

  @Action(CreateExchangeRate)
  createExchangeRate(ctx: StateContext<ExchangeRatesStateModel>, action: CreateExchangeRate) {
    ctx.patchState({ mutating: true, error: null });
    return this.api.create(action.dto).pipe(
      tap((created) => {
        ctx.patchState({
          selectedSheet: created,
          currentSheet: created,
          mutating: false,
        });
        ctx.dispatch(new LoadExchangeRates());
      }),
      catchError((err) => {
        ctx.patchState({
          mutating: false,
          error: err?.message || 'Failed to create exchange rate sheet.',
        });
        return throwError(() => err);
      }),
    );
  }

  @Action(SetExchangeRatesPage)
  setPage(ctx: StateContext<ExchangeRatesStateModel>, action: SetExchangeRatesPage) {
    ctx.patchState({
      page: action.page,
      pageSize: action.pageSize,
      ...(action.sortField !== undefined
        ? { sortField: action.sortField, sortDirection: action.sortDirection ?? null }
        : {}),
    });
    return ctx.dispatch(new LoadExchangeRates());
  }

  @Action(SetExchangeRatesFilter)
  setFilter(ctx: StateContext<ExchangeRatesStateModel>, action: SetExchangeRatesFilter) {
    const state = ctx.getState();
    ctx.patchState({
      filters: { ...state.filters, ...action.filters },
      page: 1,
    });
    return ctx.dispatch(new LoadExchangeRates());
  }

  @Action(ClearExchangeRatesFilter)
  clearFilter(ctx: StateContext<ExchangeRatesStateModel>) {
    ctx.patchState({
      filters: { search: '' },
      page: 1,
    });
    return ctx.dispatch(new LoadExchangeRates());
  }

  @Action(SetExchangeRatesSort)
  setSort(ctx: StateContext<ExchangeRatesStateModel>, action: SetExchangeRatesSort) {
    ctx.patchState({
      sortField: action.sortField,
      sortDirection: action.sortDirection,
      page: 1,
    });
    return ctx.dispatch(new LoadExchangeRates());
  }
}
