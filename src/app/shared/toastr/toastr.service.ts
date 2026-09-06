import { Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { Alert, Type } from './toastr.component';

/**
 * Global notification service that powers the `ToastrComponent` overlay.
 *
 * Emits alert objects via a private `Subject`; the component subscribes and
 * automatically clears the message after `delay` milliseconds.
 *
 * Also exposes an `isLoading` signal used by `GeneralLoaderComponent` to
 * display a full-page loading indicator.
 */
@Injectable({
  providedIn: 'root',
})
export class ToastrService {
  private toastrSubject = new Subject<Alert>();
  private toastrObservable = this.toastrSubject.asObservable();

  /** Signal indicating whether a full-page loading overlay should be visible. */
  public isLoading = signal(false);

  /** Observable stream of `Alert` objects consumed by `ToastrComponent`. */
  get toastr() {
    return this.toastrObservable;
  }

  /**
   * Emits a toast notification and schedules an automatic dismissal.
   *
   * @param {Type} type - Visual variant: `'success'` or `'error'`.
   * @param {string} message - Message text displayed in the toast.
   * @param {number} [delay=4000] - Auto-dismiss delay in milliseconds.
   */
  triggerToastr(type: Type, message: string, delay = 4000): void {
    this.toastrSubject.next({ type, message });
    setTimeout(() => {
      this.toastrSubject.next({ type, message: '' });
    }, delay);
  }

  /** Sets `isLoading` to `true`, showing the full-page loading overlay. */
  public IsLoading() {
    this.isLoading.set(true);
  }

  /** Sets `isLoading` to `false`, hiding the full-page loading overlay. */
  public IsDone() {
    this.isLoading.set(false);
  }
}
