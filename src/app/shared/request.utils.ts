import { HttpErrorResponse, HttpParams } from '@angular/common/http';

/**
 * Query parameters produced by PrimeNG `TableLazyLoadEvent` for use with
 * paginated API endpoints.
 */
export interface PagedQueryParams {
  first?: number;
  rows?: number;
  globalFilter?: string;
  sortField?: string;
  sortOrder?: number;
  status?: string;
}

/**
 * Generic paginated response shape returned by various backend endpoints.
 * Fields vary by API version; `normalizeListResponse` resolves them to a
 * canonical `NormalizedPage` shape.
 *
 * @template T - The list item type.
 */
export interface PagedData<T> {
  totalPages?: number;
  pageIndex?: number;
  pageSize?: number;
  totalCount?: number;
  pagination?: {
    totalPages?: number;
    page?: number;
    pageIndex?: number;
    pageSize?: number;
    limit?: number;
    total?: number;
    totalCount?: number;
  };
  results?: T[];
  items?: T[];
  data?: T[];
}

/**
 * Canonical paginated response shape used internally after normalization.
 *
 * @template T - The list item type.
 */
export interface NormalizedPage<T> {
  results: T[];
  totalPages: number;
  pageIndex: number;
  pageSize: number;
  totalCount: number;
}

/**
 * Converts a PrimeNG `TableLazyLoadEvent`-style params object into an
 * `HttpParams` instance suitable for paginated API requests.
 *
 * Handles page-index derivation from `first`/`rows`, search, status,
 * and sort parameters.
 *
 * @param {PagedQueryParams} [params] - Source pagination/filter parameters.
 * @returns {HttpParams} Populated `HttpParams` for the HTTP request.
 */
export const buildListParams = (params?: PagedQueryParams): HttpParams => {
  let httpParams = new HttpParams();

  if (!params) {
    return httpParams;
  }

  const pageSize = params.rows ?? 10;
  const pageIndex = Math.floor((params.first ?? 0) / pageSize) + 1;

  httpParams = httpParams.set('pageIndex', String(pageIndex));
  httpParams = httpParams.set('pageSize', String(pageSize));

  if (params.globalFilter) {
    httpParams = httpParams.set('search', params.globalFilter);
  }

  if (params.status) {
    httpParams = httpParams.set('status', params.status);
  }

  if (params.sortField) {
    httpParams = httpParams.set('sortBy', params.sortField);
    httpParams = httpParams.set('sortOrder', params.sortOrder === -1 ? 'desc' : 'asc');
  }

  return httpParams;
};

/**
 * Normalises heterogeneous paginated API responses into a single
 * `NormalizedPage` shape.
 *
 * Handles plain arrays (treated as single-page results) and various
 * pagination envelope structures found across backend versions.
 *
 * @template T - The list item type.
 * @param {PagedData<T> | T[]} data - Raw response from the API.
 * @returns {NormalizedPage<T>} Canonical paginated response.
 */
export const normalizeListResponse = <T>(data: PagedData<T> | T[]): NormalizedPage<T> => {
  if (Array.isArray(data)) {
    return {
      results: data,
      totalPages: 1,
      pageIndex: 1,
      pageSize: data.length,
      totalCount: data.length,
    };
  }

  const results = data.results ?? data.items ?? data.data ?? [];
  const pagination = data.pagination;

  return {
    results,
    totalPages: data.totalPages ?? pagination?.totalPages ?? 1,
    pageIndex: data.pageIndex ?? pagination?.pageIndex ?? pagination?.page ?? 1,
    pageSize: data.pageSize ?? pagination?.pageSize ?? pagination?.limit ?? results.length,
    totalCount: data.totalCount ?? pagination?.totalCount ?? pagination?.total ?? results.length,
  };
};

/**
 * Type-guard that checks whether an unknown value has a `message: string` property.
 *
 * @param {unknown} value - The value to test.
 * @returns {value is { message: string }} `true` when `value` has a string `message`.
 */
export const hasMessage = (value: unknown): value is { message: string } =>
  typeof value === 'object' &&
  value !== null &&
  'message' in value &&
  typeof (value as { message: unknown }).message === 'string';

/**
 * Extracts a user-facing error message from an unknown caught error.
 *
 * Tries `HttpErrorResponse.error.message`, raw string `error.error`, then
 * `error.message` before falling back to `fallbackMessage`.
 *
 * @param {unknown} error - The raw error from a `catchError` handler.
 * @param {string} fallbackMessage - Message to return when no readable message is found.
 * @returns {string} A human-readable error message string.
 */
export const extractErrorMessage = (error: unknown, fallbackMessage: string): string => {
  if (error instanceof HttpErrorResponse) {
    if (hasMessage(error.error)) {
      return error.error.message;
    }

    if (typeof error.error === 'string') {
      return error.error;
    }

    if (error.message) {
      return error.message;
    }
  }

  return fallbackMessage;
};

/**
 * Extracts an array of error message strings from a structured API error response.
 *
 * Handles `errors` arrays, `errors` strings, `error` strings/objects with a
 * `message` property, and top-level `message` fields.
 *
 * @param {{ errors?: unknown; error?: unknown; message?: string | null }} response - The raw response object.
 * @param {string} fallbackMessage - Default message when no specific errors are found.
 * @returns {string[]} An array of human-readable error messages.
 */
export const extractResponseErrors = (
  response: { errors?: unknown; error?: unknown; message?: string | null },
  fallbackMessage: string,
): string[] => {
  if (Array.isArray(response.errors)) {
    return response.errors.filter((error): error is string => typeof error === 'string');
  }

  if (typeof response.errors === 'string') {
    return [response.errors];
  }

  if (typeof response.error === 'string') {
    return [response.error];
  }

  if (hasMessage(response.error)) {
    return [response.error.message];
  }

  if (response.message) {
    return [response.message];
  }

  return [fallbackMessage];
};
