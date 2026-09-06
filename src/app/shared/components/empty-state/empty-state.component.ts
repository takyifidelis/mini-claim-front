import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  template: `
    <div class="empty-state" [class.empty-state--error]="isError()">
      <div class="empty-state__icon" aria-hidden="true">
        <span class="material-symbols-outlined">{{ icon() }}</span>
      </div>
      <h3 class="empty-state__title">{{ title() }}</h3>
      <p class="empty-state__description">{{ description() }}</p>
      @if (actionLabel()) {
        <div class="empty-state__actions">
          <button type="button" class="btn btn-outline-success" (click)="actionClicked.emit()">
            {{ actionLabel() }}
          </button>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .empty-state {
        padding: 3rem 1.5rem;
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;

        &__icon {
          font-size: 3rem;
          color: #94a3b8;
          margin-bottom: 0.75rem;

          .material-symbols-outlined {
            font-size: 3rem;
          }
        }

        &__title {
          font-size: 1.125rem;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 0.5rem;
        }

        &__description {
          font-size: 0.875rem;
          color: #64748b;
          max-width: 420px;
          margin: 0 0 1.25rem;
        }

        &--error {
          .empty-state__icon {
            color: #dc2626;
          }
        }
      }
    `,
  ],
})
/**
 * Reusable empty-state / error-state placeholder shown inside list views.
 *
 * Supports an optional action button that emits `actionClicked` when clicked,
 * allowing parent components to trigger filter-clearing or data-reloading.
 */
export class EmptyStateComponent {
  /** Material Symbols icon name. Defaults to `'inbox'`. */
  readonly icon = input('inbox');
  /** Heading text. Defaults to `'No records found'`. */
  readonly title = input('No records found');
  /** Supporting description. Defaults to `'There are no items to display.'`. */
  readonly description = input('There are no items to display.');
  /** Label for the optional action button; no button is rendered when empty. */
  readonly actionLabel = input('');
  /** When `true`, the icon is rendered in red to convey an error state. */
  readonly isError = input(false);

  /** Emitted when the optional action button is clicked. */
  readonly actionClicked = output<void>();
}
