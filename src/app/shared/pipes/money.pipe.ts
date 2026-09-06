import { Pipe, PipeTransform } from '@angular/core';

/**
 * Formats a numeric string or number as a locale-aware monetary amount.
 *
 * Outputs two decimal places and prepends the currency code when provided.
 * Returns `'—'` for null, undefined, or empty input values.
 *
 * @example
 * // '1,250.00'
 * {{ '1250' | money }}
 * // 'USD 1,250.00'
 * {{ '1250' | money: 'USD' }}
 */
@Pipe({
  name: 'money',
})
export class MoneyPipe implements PipeTransform {
  /**
   * @param {string | number | null | undefined} value - The monetary value to format.
   * @param {string | null} [currency] - Optional currency code prepended to the output.
   * @returns {string} Formatted string, or `'—'` for empty/invalid input.
   */
  transform(value: string | number | null | undefined, currency?: string | null): string {
    if (value === null || value === undefined || value === '') {
      return '—';
    }

    const strVal = String(value).trim();
    const num = Number(strVal);
    if (isNaN(num)) {
      return strVal;
    }

    const formatted = num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    return currency ? `${currency} ${formatted}` : formatted;
  }
}
