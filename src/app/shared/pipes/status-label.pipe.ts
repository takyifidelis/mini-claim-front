import { Pipe, PipeTransform } from '@angular/core';
import { CLAIM_STATUS_LABELS } from '../models';

const STATUS_MAP: Record<string, string> = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  EXPIRED: 'Expired',
  CANCELLED: 'Cancelled',
  APPROVED: 'Approved',
  ...CLAIM_STATUS_LABELS,
};

/**
 * Transforms a raw status code string into a human-readable label.
 *
 * Covers both general entity statuses (ACTIVE, EXPIRED, CANCELLED, etc.) and
 * all derived claim lifecycle statuses via `CLAIM_STATUS_LABELS`. Falls back
 * to replacing underscores with spaces for unrecognised codes.
 *
 * @example
 * // 'Payment Outstanding'
 * {{ 'PAYMENT_OUTSTANDING' | statusLabel }}
 */
@Pipe({
  name: 'statusLabel',
})
export class StatusLabelPipe implements PipeTransform {
  /**
   * @param {string | null | undefined} value - The raw status code to transform.
   * @returns {string} Human-readable label, or `'—'` for null/undefined/empty values.
   */
  transform(value: string | null | undefined): string {
    if (!value) {
      return '—';
    }
    return STATUS_MAP[value] || value.replace(/_/g, ' ');
  }
}
