import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { parseApiError } from '../errors/api-error.model';

/**
 * Functional HTTP interceptor that normalises all HTTP errors into
 * `ApiError` instances before propagating them downstream.
 *
 * Applied globally in `app.config.ts` via `withInterceptors`.  Every
 * failed HTTP response will be re-thrown as an `ApiError` so that NGXS
 * action handlers and components receive a consistent error shape.
 */
export const apiErrorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: unknown) => {
      const apiError = parseApiError(error);
      return throwError(() => apiError);
    }),
  );
};
