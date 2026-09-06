import { inject, Injectable } from '@angular/core';
import { Action, Selector, State, StateContext } from '@ngxs/store';
import { catchError, map, tap, throwError } from 'rxjs';
import { RiskCoversApiService } from '../../core/api/risk-covers-api.service';
import {
  CreateRiskCoverDto,
  PaginatedFeatureState,
  QueryRiskCoversDto,
  RiskCover,
  RiskCoverFilters,
} from '../../shared/models';

/**
 * NGXS state model for the Risk Covers feature.
 *
 * Extends the generic paginated state with a selected record for the detail
 * view and a `mutating` flag for create operations.
 */
export interface RiskCoversStateModel extends PaginatedFeatureState<RiskCover, RiskCoverFilters> {
  /** The risk cover loaded for the detail view, or `null` when none is selected. */
  selected: RiskCover | null;
  /** `true` while a create mutation is in flight. */
  mutating: boolean;
}

/** Triggers loading of the paginated risk covers list. */
export class LoadRiskCovers {
  static readonly type = '[RiskCovers] Load List';
}

/** Loads the full detail of a risk cover into `selected`. */
export class LoadRiskCoverDetail {
  static readonly type = '[RiskCovers] Load Detail';
  constructor(public readonly id: string) {}
}

/** Creates a new risk cover catalogue entry. */
export class CreateRiskCover {
  static readonly type = '[RiskCovers] Create';
  constructor(public readonly dto: CreateRiskCoverDto) {}
}

/** Updates the current page and page size, then reloads the list. */
export class SetRiskCoversPage {
  static readonly type = '[RiskCovers] Set Page';
  constructor(
    public readonly page: number,
    public readonly pageSize: number,
    public readonly sortField?: string | null,
    public readonly sortDirection?: 'asc' | 'desc' | null,
  ) {}
}

/** Merges partial filter values into the active filter set and reloads from page 1. */
export class SetRiskCoversFilter {
  static readonly type = '[RiskCovers] Set Filter';
  constructor(public readonly filters: Partial<RiskCoverFilters>) {}
}

/** Resets all filters to their default values and reloads from page 1. */
export class ClearRiskCoversFilter {
  static readonly type = '[RiskCovers] Clear Filter';
}

/** Updates the active sort field and direction, then reloads from page 1. */
export class SetRiskCoversSort {
  static readonly type = '[RiskCovers] Set Sort';
  constructor(
    public readonly sortField: string | null,
    public readonly sortDirection: 'asc' | 'desc' | null,
  ) {}
}

const DEFAULT_STATE: RiskCoversStateModel = {
  items: [],
  total: 0,
  page: 1,
  pageSize: 10,
  sortField: 'createdAt',
  sortDirection: 'desc',
  filters: {
    status: null,
    search: '',
  },
  loading: false,
  error: null,
  selected: null,
  mutating: false,
};

/**
 * NGXS state class for the Risk Covers feature module.
 *
 * Manages the paginated risk cover catalogue list and a selected detail
 * record.  All list actions cancel in-flight requests when superseded.
 */
@State<RiskCoversStateModel>({
  name: 'riskCovers',
  defaults: DEFAULT_STATE,
})
@Injectable()
export class RiskCoversState {
  private readonly api = inject(RiskCoversApiService);

  @Selector()
  static items(state: RiskCoversStateModel): RiskCover[] {
    return state.items;
  }

  @Selector()
  static total(state: RiskCoversStateModel): number {
    return state.total;
  }

  @Selector()
  static page(state: RiskCoversStateModel): number {
    return state.page;
  }

  @Selector()
  static pageSize(state: RiskCoversStateModel): number {
    return state.pageSize;
  }

  @Selector()
  static loading(state: RiskCoversStateModel): boolean {
    return state.loading;
  }

  @Selector()
  static error(state: RiskCoversStateModel): string | null {
    return state.error;
  }

  @Selector()
  static selected(state: RiskCoversStateModel): RiskCover | null {
    return state.selected;
  }

  @Selector()
  static filters(state: RiskCoversStateModel): RiskCoverFilters {
    return state.filters;
  }

  @Selector()
  static mutating(state: RiskCoversStateModel): boolean {
    return state.mutating;
  }

  @Action(LoadRiskCovers, { cancelUncompleted: true })
  loadRiskCovers(ctx: StateContext<RiskCoversStateModel>) {
    const state = ctx.getState();
    ctx.patchState({ loading: true, error: null });

    const query: QueryRiskCoversDto = {
      page: state.page,
      pageSize: state.pageSize,
      sortBy: state.sortField || undefined,
      sortDirection: state.sortDirection || undefined,
      search: state.filters.search || undefined,
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
          error: err?.message || 'Failed to load risk covers.',
        });
        return throwError(() => err);
      }),
    );
  }

  @Action(LoadRiskCoverDetail)
  loadRiskCoverDetail(ctx: StateContext<RiskCoversStateModel>, action: LoadRiskCoverDetail) {
    ctx.patchState({ loading: true, error: null });
    return this.api.getById(action.id).pipe(
      tap((selected) => {
        ctx.patchState({
          selected,
          loading: false,
          error: null,
        });
      }),
      catchError((err) => {
        ctx.patchState({
          loading: false,
          error: err?.message || 'Failed to load risk cover details.',
        });
        return throwError(() => err);
      }),
    );
  }

  @Action(CreateRiskCover)
  createRiskCover(ctx: StateContext<RiskCoversStateModel>, action: CreateRiskCover) {
    ctx.patchState({ mutating: true, error: null });
    return this.api.create(action.dto).pipe(
      tap((created) => {
        ctx.patchState({
          selected: created,
          mutating: false,
        });
        ctx.dispatch(new LoadRiskCovers());
      }),
      catchError((err) => {
        ctx.patchState({ mutating: false, error: err?.message || 'Failed to create risk cover.' });
        return throwError(() => err);
      }),
    );
  }

  @Action(SetRiskCoversPage)
  setPage(ctx: StateContext<RiskCoversStateModel>, action: SetRiskCoversPage) {
    ctx.patchState({
      page: action.page,
      pageSize: action.pageSize,
      ...(action.sortField !== undefined
        ? { sortField: action.sortField, sortDirection: action.sortDirection ?? null }
        : {}),
    });
    return ctx.dispatch(new LoadRiskCovers());
  }

  @Action(SetRiskCoversFilter)
  setFilter(ctx: StateContext<RiskCoversStateModel>, action: SetRiskCoversFilter) {
    const state = ctx.getState();
    ctx.patchState({
      filters: { ...state.filters, ...action.filters },
      page: 1,
    });
    return ctx.dispatch(new LoadRiskCovers());
  }

  @Action(ClearRiskCoversFilter)
  clearFilter(ctx: StateContext<RiskCoversStateModel>) {
    ctx.patchState({
      filters: { status: null, search: '' },
      page: 1,
    });
    return ctx.dispatch(new LoadRiskCovers());
  }

  @Action(SetRiskCoversSort)
  setSort(ctx: StateContext<RiskCoversStateModel>, action: SetRiskCoversSort) {
    ctx.patchState({
      sortField: action.sortField,
      sortDirection: action.sortDirection,
      page: 1,
    });
    return ctx.dispatch(new LoadRiskCovers());
  }
}
