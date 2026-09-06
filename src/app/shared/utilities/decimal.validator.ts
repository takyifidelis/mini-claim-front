import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const MONEY_REGEX = /^(0|[1-9]\d{0,14})(\.\d{1,2})?$/;
export const RATE_REGEX = /^(0|[1-9]\d{0,14})(\.\d{1,4})?$/;

/**
 * Validates money string format according to strict business rules.
 *
 * Accepts an optional `allowZero` flag (default `true`).  When `false`, zero
 * amounts are rejected with a `moneyPositive` error.
 *
 * @param {{ allowZero?: boolean }} [options] - Validator configuration.
 * @returns {ValidatorFn} Angular `ValidatorFn` compatible with Reactive Forms.
 */
export function moneyValidator(options?: { allowZero?: boolean }): ValidatorFn {
  const allowZero = options?.allowZero ?? true;
  return (control: AbstractControl): ValidationErrors | null => {
    const raw = control.value;
    if (raw === null || raw === undefined || raw === '') {
      return null;
    }

    const value = String(raw).trim();
    if (!MONEY_REGEX.test(value)) {
      return {
        money:
          'Enter a valid monetary amount (up to 15 digits, max 2 decimals, no commas or signs).',
      };
    }

    const num = Number(value);
    if (!allowZero && num <= 0) {
      return { moneyPositive: 'Amount must be strictly greater than 0.00.' };
    }

    if (num < 0) {
      return { moneyNonNegative: 'Amount cannot be negative.' };
    }

    return null;
  };
}

/**
 * Validates exchange rate string format (Bank of Ghana standard: up to 4 decimal places).
 *
 * The rate must be a strictly positive number.
 *
 * @returns {ValidatorFn} Angular `ValidatorFn` that produces a `ratePositive` error for zero/negative values.
 */
export function rateValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const raw = control.value;
    if (raw === null || raw === undefined || raw === '') {
      return null;
    }

    const value = String(raw).trim();
    if (!RATE_REGEX.test(value)) {
      return { rate: 'Enter a valid rate (up to 15 digits, max 4 decimals, no commas or signs).' };
    }

    const num = Number(value);
    if (num <= 0) {
      return { ratePositive: 'Rate must be strictly greater than 0.' };
    }

    return null;
  };
}

/**
 * Validates that a date is not in the future.
 *
 * Accepts today and earlier dates, but rejects any date after the current local date.
 *
 * Supports both the `Date` values emitted by PrimeNG's date picker and
 * ISO date-only strings used by the API forms.
 *
 * @param {string} [errorKey='dateNotInFuture'] - Key under which the error is set.
 * @returns {ValidatorFn} Single-field `ValidatorFn` for a date control.
 */
export function dateNotInFutureValidator(errorKey = 'dateNotInFuture'): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const rawValue = control.value;
    if (!rawValue) {
      return null;
    }

    let inputDate: Date;
    if (rawValue instanceof Date) {
      if (Number.isNaN(rawValue.getTime())) {
        return null;
      }
      inputDate = new Date(rawValue.getFullYear(), rawValue.getMonth(), rawValue.getDate());
    } else {
      const value = String(rawValue).trim();
      const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (!match) {
        return null;
      }

      const year = Number(match[1]);
      const month = Number(match[2]) - 1;
      const day = Number(match[3]);
      inputDate = new Date(year, month, day);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (inputDate > today) {
      return { [errorKey]: true };
    }

    return null;
  };
}

/**
 * Validates that dateA is before or equal to dateB.
 *
 * Designed for cross-field validation on a `FormGroup`; applied via
 * `FormGroup.validators`.
 *
 * @param {string} startDateKey - Control name for the start/earlier date.
 * @param {string} endDateKey - Control name for the end/later date.
 * @param {string} [errorKey='dateRangeInvalid'] - Key under which the error is set on the group.
 * @returns {ValidatorFn} Cross-field `ValidatorFn` for a `FormGroup`.
 */
export function dateBeforeOrEqualValidator(
  startDateKey: string,
  endDateKey: string,
  errorKey = 'dateRangeInvalid',
): ValidatorFn {
  return (formGroup: AbstractControl): ValidationErrors | null => {
    const startVal = formGroup.get(startDateKey)?.value;
    const endVal = formGroup.get(endDateKey)?.value;

    if (!startVal || !endVal) {
      return null;
    }

    const startDate = new Date(startVal);
    const endDate = new Date(endVal);

    if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
      if (startDate > endDate) {
        return { [errorKey]: true };
      }
    }

    return null;
  };
}

/**
 * Normalizes a money string to exactly 2 decimal places.
 * E.g., "100" -> "100.00", "50.5" -> "50.50", "0" -> "0.00".
 *
 * Invalid or empty values fall back to `'0.00'`.  Non-matching strings are
 * returned as-is.
 *
 * @param {string | number | null | undefined} value - The raw monetary string or number.
 * @returns {string} A string with exactly 2 decimal places.
 */
export function normalizeMoneyString(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return '0.00';
  }
  const str = String(value).trim();
  if (!MONEY_REGEX.test(str)) {
    return str;
  }
  const parts = str.split('.');
  const integerPart = parts[0] || '0';
  const fractionalPart = parts[1] || '';
  if (fractionalPart.length === 0) {
    return `${integerPart}.00`;
  }
  if (fractionalPart.length === 1) {
    return `${integerPart}.${fractionalPart}0`;
  }
  return `${integerPart}.${fractionalPart.slice(0, 2)}`;
}

/**
 * Normalizes an exchange rate string to canonical 4 decimal places (Bank of Ghana standard).
 *
 * Invalid, zero, or negative values fall back to `'1.0000'`.
 *
 * @param {string | number | null | undefined} value - The raw rate value.
 * @returns {string} Rate string fixed to 4 decimal places.
 */
export function normalizeRateString(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return '1.0000';
  }
  const str = String(value).trim();
  const num = parseFloat(str);
  if (isNaN(num) || num <= 0) {
    return '1.0000';
  }
  return num.toFixed(4);
}

/**
 * Builds all 6 bidirectional exchange rate entries from GHS base currency
 * given the USD equivalent of GHS 1 and EUR equivalent of GHS 1 (Bank of Ghana 4 decimal places).
 *
 * Returns an empty array when either rate is invalid or non-positive.
 *
 * @param {number | string} usdRateVal - GHS-to-USD rate (how many USD equals 1 GHS).
 * @param {number | string} eurRateVal - GHS-to-EUR rate (how many EUR equals 1 GHS).
 * @returns {{ fromCurrency: 'GHS' | 'USD' | 'EUR'; toCurrency: 'GHS' | 'USD' | 'EUR'; rate: string }[]} Six bidirectional rate entry objects.
 */
export function buildExchangeRateEntriesFromBaseGhs(
  usdRateVal: number | string,
  eurRateVal: number | string,
): { fromCurrency: 'GHS' | 'USD' | 'EUR'; toCurrency: 'GHS' | 'USD' | 'EUR'; rate: string }[] {
  const rUsd = typeof usdRateVal === 'number' ? usdRateVal : parseFloat(String(usdRateVal).trim());
  const rEur = typeof eurRateVal === 'number' ? eurRateVal : parseFloat(String(eurRateVal).trim());

  if (isNaN(rUsd) || rUsd <= 0 || isNaN(rEur) || rEur <= 0) {
    return [];
  }

  const ghsToUsd = rUsd.toFixed(4);
  const usdToGhs = (1 / rUsd).toFixed(4);

  const ghsToEur = rEur.toFixed(4);
  const eurToGhs = (1 / rEur).toFixed(4);

  const usdToEur = (rEur / rUsd).toFixed(4);
  const eurToUsd = (rUsd / rEur).toFixed(4);

  return [
    { fromCurrency: 'GHS', toCurrency: 'USD', rate: ghsToUsd },
    { fromCurrency: 'USD', toCurrency: 'GHS', rate: usdToGhs },
    { fromCurrency: 'GHS', toCurrency: 'EUR', rate: ghsToEur },
    { fromCurrency: 'EUR', toCurrency: 'GHS', rate: eurToGhs },
    { fromCurrency: 'USD', toCurrency: 'EUR', rate: usdToEur },
    { fromCurrency: 'EUR', toCurrency: 'USD', rate: eurToUsd },
  ];
}
