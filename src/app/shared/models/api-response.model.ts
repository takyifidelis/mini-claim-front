/**
 * Standard API envelope returned by every successful backend response.
 *
 * @template T - The type of the `data` payload.
 */
export interface ApiResponse<T> {
  /** Whether the request succeeded on the server. */
  success: boolean;
  /** HTTP status code echoed from the server. */
  statusCode: number;
  /** Human-readable result message. */
  message: string;
  /** The actual response payload. */
  data: T;
}

/**
 * Standard API envelope returned by error responses.
 *
 * The `data` field carries structured error metadata when the server provides it.
 */
export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  message: string;
  data?: {
    /** Machine-readable error code. */
    code: string;
    /** Structured field-level or contextual error details. */
    details?: Record<string, unknown> | string[] | unknown;
    /** ISO timestamp of the error. */
    timestamp: string;
    /** Request path that triggered the error. */
    path: string;
  };
}
