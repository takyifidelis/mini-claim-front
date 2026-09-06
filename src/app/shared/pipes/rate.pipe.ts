import { Pipe, PipeTransform } from '@angular/core';

/**
 * Formats an exchange rate value to exactly 4 decimal places (Bank of Ghana standard).
 *
 * Returns `'—'` for null, undefined, or empty values and passes through
 * non-numeric strings unmodified.
 *
 * @example
 * // '15.5000'
 * {{ '15.5' | rate }}
 */
@Pipe({
  name: 'rate',
})
export class RatePipe implements PipeTransform {
  /**
   * @param {string | number | null | undefined} value - The rate value to format.
   * @returns {string} Rate formatted to 4 decimal places, or `'—'` for empty/invalid input.
   */
  transform(value: string | number | null | undefined): string {
    if (value === null || value === undefined || value === '') {
      return '—';
    }

    const strVal = String(value).trim();
    const num = Number(strVal);
    if (isNaN(num)) {
      return strVal;
    }

    return num.toFixed(4);
  }
}
