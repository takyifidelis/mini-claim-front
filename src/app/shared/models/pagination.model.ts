/** Query parameters common to all paginated list endpoints. */
export interface PaginationQuery {
  /** 1-based page number. */
  page?: number;
  /** Number of records per page. */
  pageSize?: number;
  /** Free-text search filter applied server-side. */
  search?: string;
  /** Field name to sort by. */
  sortBy?: string;
  /** Sort direction. */
  sortDirection?: 'asc' | 'desc';
}

/**
 * Generic paginated response envelope used by list API endpoints.
 *
 * @template T - The type of items in the page.
 */
export interface PaginatedResponse<T> {
  /** The records for the current page. */
  items: T[];
  /** 1-based current page number. */
  page: number;
  /** Number of records per page. */
  pageSize: number;
  /** Total number of matching records across all pages. */
  totalItems: number;
  /** Total number of pages. */
  totalPages: number;
}

/**
 * Generic NGXS state slice shared by all paginated feature modules.
 *
 * @template T - The list item type.
 * @template TFilters - The feature-specific filter object type.
 */
export interface PaginatedFeatureState<T, TFilters> {
  /** Records for the currently loaded page. */
  items: T[];
  /** Total number of matching records on the server. */
  total: number;
  /** Current 1-based page number. */
  page: number;
  /** Current page size. */
  pageSize: number;
  /** Active sort field name, or `null` for default ordering. */
  sortField: string | null;
  /** Active sort direction, or `null` for default ordering. */
  sortDirection: 'asc' | 'desc' | null;
  /** Active filter values applied to the list query. */
  filters: TFilters;
  /** Whether a list-loading request is in flight. */
  loading: boolean;
  /** Last list-load error message, or `null` when healthy. */
  error: string | null;
}
