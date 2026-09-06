import { Component, computed, input } from '@angular/core';
import { CLAIM_STATUS_LABELS, DerivedClaimStatus } from '../../models';

@Component({
  selector: 'app-status-badge',
  template: `
    <span
      class="status-badge status-badge--{{ badgeClass() }}"
      [attr.aria-label]="'Status: ' + label()"
    >
      <span class="status-badge__dot" aria-hidden="true"></span>
      <span class="status-badge__text">{{ label() }}</span>
    </span>
  `,
  styles: [
    `
      .status-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.375rem;
        padding: 0.25rem 0.625rem;
        font-size: 0.75rem;
        font-weight: 600;
        border-radius: 9999px;
        line-height: 1;
        white-space: nowrap;

        &__dot {
          width: 0.5rem;
          height: 0.5rem;
          border-radius: 50%;
          background-color: currentColor;
        }

        &--success {
          color: #047857;
          background-color: #d1fae5;
        }

        &--warning {
          color: #b45309;
          background-color: #fef3c7;
        }

        &--danger {
          color: #b91c1c;
          background-color: #fee2e2;
        }

        &--info {
          color: #1d4ed8;
          background-color: #dbeafe;
        }

        &--neutral {
          color: #475569;
          background-color: #f1f5f9;
        }
      }
    `,
  ],
})
/**
 * Pill-shaped status badge that maps a raw status code to a colour-coded label.
 *
 * Covers claim lifecycle statuses, policy statuses (ACTIVE / EXPIRED / CANCELLED),
 * and risk cover statuses (ACTIVE / INACTIVE).  Unrecognised codes are displayed
 * with underscores replaced by spaces and a neutral grey colour.
 */
export class StatusBadgeComponent {
  /** Raw status code, e.g. `'PAYMENT_OUTSTANDING'` or `'ACTIVE'`. */
  readonly status = input.required<string>();

  protected readonly label = computed(() => {
    const s = this.status();
    if (s in CLAIM_STATUS_LABELS) {
      return CLAIM_STATUS_LABELS[s as DerivedClaimStatus];
    }
    return s.replace(/_/g, ' ');
  });

  protected readonly badgeClass = computed(() => {
    const s = this.status();
    switch (s) {
      case 'PAID':
      case 'ACTIVE':
      case 'APPROVED':
        return 'success';
      case 'PAYMENT_OUTSTANDING':
      case 'RESERVED_NOT_SETTLED':
        return 'warning';
      case 'DENIED':
      case 'CANCELLED':
      case 'EXPIRED':
        return 'danger';
      case 'UNDER_REVIEW':
        return 'info';
      default:
        return 'neutral';
    }
  });
}
