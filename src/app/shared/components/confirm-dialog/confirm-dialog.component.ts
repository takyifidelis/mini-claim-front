import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  template: `
    @if (visible()) {
      <div
        class="confirm-dialog-overlay"
        role="dialog"
        aria-modal="true"
        [attr.aria-labelledby]="titleId"
        (keydown.escape)="cancel.emit()"
      >
        <div class="confirm-dialog-panel">
          <div class="confirm-dialog-panel__header">
            <h3 [id]="titleId">{{ title() }}</h3>
            <button
              type="button"
              class="btn-close"
              aria-label="Close"
              (click)="cancel.emit()"
            ></button>
          </div>
          <div class="confirm-dialog-panel__body">
            <p>{{ message() }}</p>
            <ng-content></ng-content>
          </div>
          <div class="confirm-dialog-panel__footer">
            <button
              type="button"
              class="btn btn-secondary"
              (click)="cancel.emit()"
              [disabled]="loading()"
            >
              {{ cancelLabel() }}
            </button>
            <button
              type="button"
              class="btn"
              [class.btn-danger]="danger()"
              [class.btn-success]="!danger()"
              (click)="confirm.emit()"
              [disabled]="loading()"
            >
              @if (loading()) {
                <span
                  class="spinner-border spinner-border-sm me-1"
                  role="status"
                  aria-hidden="true"
                ></span>
              }
              {{ confirmLabel() }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .confirm-dialog-overlay {
        position: fixed;
        inset: 0;
        z-index: 1050;
        background: rgba(15, 23, 42, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1rem;
        backdrop-filter: blur(2px);
      }

      .confirm-dialog-panel {
        background: #ffffff;
        border-radius: 12px;
        box-shadow:
          0 20px 25px -5px rgba(0, 0, 0, 0.1),
          0 10px 10px -5px rgba(0, 0, 0, 0.04);
        width: 100%;
        max-width: 480px;
        overflow: hidden;

        &__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.25rem;
          border-bottom: 1px solid #e2e8f0;

          h3 {
            margin: 0;
            font-size: 1.125rem;
            font-weight: 600;
            color: #0f172a;
          }
        }

        &__body {
          padding: 1.25rem;
          font-size: 0.875rem;
          color: #334155;
          line-height: 1.5;

          p {
            margin: 0 0 0.5rem;
          }
        }

        &__footer {
          display: flex;
          justify-content: flex-end;
          gap: 0.5rem;
          padding: 0.875rem 1.25rem;
          background: #f8fafc;
          border-top: 1px solid #e2e8f0;
        }
      }
    `,
  ],
})
/**
 * Inline confirmation dialog overlay rendered inside the parent view's template.
 *
 * Unlike modal dialog services, this component is embedded directly in the
 * template and shown/hidden via the `visible` input.  It supports both
 * destructive (danger) and neutral confirm actions.
 */
export class ConfirmDialogComponent {
  /** Controls dialog visibility. */
  readonly visible = input(false);
  /** Dialog heading text. */
  readonly title = input('Confirm Action');
  /** Body message text; additional content can be projected via `<ng-content>`. */
  readonly message = input('Are you sure you want to proceed?');
  /** Label for the confirm button. */
  readonly confirmLabel = input('Confirm');
  /** Label for the cancel button. */
  readonly cancelLabel = input('Cancel');
  /** When `true`, the confirm button is rendered in red (danger variant). */
  readonly danger = input(false);
  /** When `true`, both buttons are disabled and a spinner appears on the confirm button. */
  readonly loading = input(false);

  /** Emitted when the user clicks the confirm button. */
  readonly confirm = output<void>();
  /** Emitted when the user clicks Cancel or presses Escape. */
  readonly cancel = output<void>();

  protected readonly titleId = `confirm-dialog-title-${Math.random().toString(36).substring(2, 9)}`;
}
