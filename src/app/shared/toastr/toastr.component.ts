import { Component, inject } from '@angular/core';
import { ToastrService } from './toastr.service';
import { Observable } from 'rxjs';
import { AsyncPipe, NgStyle } from '@angular/common';

/** Visual type variant for toast notifications. */
export type Type = 'success' | 'error';

/** Data contract for a single toast notification. */
export interface Alert {
  type: Type;
  message: string;
}

/**
 * Global toast notification overlay.
 *
 * Subscribes to `ToastrService.toastr` on init and renders the latest
 * alert.  The parent service handles automatic dismissal via a `setTimeout`.
 */
@Component({
  selector: 'app-toastr',
  imports: [AsyncPipe, NgStyle],
  templateUrl: './toastr.component.html',
  styleUrl: './toastr.component.scss',
})
export class ToastrComponent {
  private toastrService = inject(ToastrService);

  /** Observable stream of alerts consumed by the template's `async` pipe. */
  public toastr$!: Observable<Alert>;

  /** Subscribes `toastr$` to the service observable. */
  ngOnInit(): void {
    this.toastr$ = this.toastrService.toastr;
  }

  /** Clears the loading state when the user manually closes the toast. */
  onClose() {
    this.toastrService.IsDone();
  }
}
