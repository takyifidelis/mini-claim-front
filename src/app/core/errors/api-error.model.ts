/**
 * Normalised representation of an API error, mapped from the NestJS error envelope.
 *
 * Instances of this interface are thrown by `parseApiError` and propagated
 * through the NGXS action pipeline via `throwError`.
 */
export interface ApiError {
  /** Machine-readable error code from the NestJS response body. */
  code: string;
  /** Human-readable error message surfaced in the UI. */
  message: string;
  /** Optional structured error details (field-level validation errors, etc.). */
  details?: Record<string, unknown> | string[] | unknown;
  /** ISO timestamp from the server error payload. */
  timestamp?: string;
  /** Request path from the server error payload. */
  path?: string;
  /** HTTP status code, when available. */
  statusCode?: number;
}

/**
 * Parses an unknown error value into a normalised {@link ApiError}.
 *
 * Handles Angular `HttpErrorResponse` wrappers, plain objects with a `message`
 * property, and raw string errors.  Falls back to a generic error object when
 * the shape cannot be determined.
 *
 * @param {unknown} error - The raw error value caught in a RxJS `catchError`.
 * @param {string} [fallbackMessage='An unexpected error occurred.'] - Message used when no readable message is found.
 * @returns {ApiError} A normalised `ApiError` suitable for display and NGXS state.
 */
export function parseApiError(
  error: unknown,
  fallbackMessage = 'An unexpected error occurred.',
): ApiError {
  if (typeof error === 'object' && error !== null) {
    const errObj = error as Record<string, unknown>;

    // Check if error is an HttpErrorResponse containing our standard NestJS envelope
    const errorResponse = (errObj['error'] ?? errObj) as Record<string, unknown>;
    if (typeof errorResponse === 'object' && errorResponse !== null) {
      const data = errorResponse['data'] as Record<string, unknown> | undefined;
      const message =
        typeof errorResponse['message'] === 'string'
          ? errorResponse['message']
          : typeof errObj['message'] === 'string'
            ? errObj['message']
            : fallbackMessage;

      const code =
        data && typeof data['code'] === 'string'
          ? data['code']
          : typeof errorResponse['code'] === 'string'
            ? errorResponse['code']
            : 'ERROR';

      const details = data?.['details'] ?? errorResponse['details'];
      const timestamp = (data?.['timestamp'] as string) ?? (errorResponse['timestamp'] as string);
      const path = (data?.['path'] as string) ?? (errorResponse['path'] as string);
      const statusCode =
        typeof errObj['status'] === 'number'
          ? errObj['status']
          : typeof errorResponse['statusCode'] === 'number'
            ? errorResponse['statusCode']
            : undefined;

      return {
        code,
        message,
        details,
        timestamp,
        path,
        statusCode,
      };
    }

    if (typeof errObj['message'] === 'string') {
      return {
        code: 'ERROR',
        message: errObj['message'],
        statusCode: typeof errObj['status'] === 'number' ? errObj['status'] : undefined,
      };
    }
  }

  if (typeof error === 'string') {
    return {
      code: 'ERROR',
      message: error,
    };
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: fallbackMessage,
  };
}
