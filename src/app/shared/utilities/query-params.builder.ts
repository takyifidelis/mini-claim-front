import { HttpParams } from '@angular/common/http';

/**
 * Builds an `HttpParams` object from an arbitrary key-value record, skipping
 * null, undefined, empty-string, and whitespace-only values.
 *
 * String values are automatically trimmed before being appended.
 *
 * @param {Record<string, unknown>} [params] - The source key-value map.
 * @returns {HttpParams} A populated `HttpParams` instance ready for use in HTTP requests.
 */
export function buildQueryParams(params?: Record<string, unknown>): HttpParams {
  let httpParams = new HttpParams();
  if (!params) {
    return httpParams;
  }

  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined && value !== '') {
      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed.length > 0) {
          httpParams = httpParams.set(key, trimmed);
        }
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        httpParams = httpParams.set(key, String(value));
      }
    }
  }

  return httpParams;
}
