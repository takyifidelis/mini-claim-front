import { ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MONEY_REGEX, RATE_REGEX } from '../utilities/decimal.validator';

/**
 * Pre-built Angular `ValidatorFn` instances reused across all reactive forms.
 * Keys match the error keys produced by each validator.
 */
export const FORM_VALIDATORS = {
  required: Validators.required,
  requiredTrue: Validators.requiredTrue,
  money: Validators.pattern(MONEY_REGEX),
  decimalRate: Validators.pattern(RATE_REGEX),
} satisfies Record<string, ValidatorFn>;

/**
 * Default user-facing validation messages keyed by Angular error token.
 * Individual form components may override entries via the `validationMessages` input.
 */
export const DEFAULT_VALIDATION_MESSAGES: Readonly<Record<string, string>> = {
  required: 'This field is required.',
  requiredTrue: 'You must check this box to continue.',
  pattern: 'Enter a valid format.',
  money: 'Enter a valid monetary amount (up to 15 digits, max 2 decimals, no commas or signs).',
  moneyPositive: 'Amount must be strictly greater than 0.00.',
  moneyNonNegative: 'Amount cannot be negative.',
  rate: 'Enter a valid rate (up to 15 digits, max 8 decimals, no commas or signs).',
  ratePositive: 'Rate must be strictly greater than 0.',
  min: 'The value is below the allowed minimum.',
  max: 'The value exceeds the allowed maximum.',
  dateRangeInvalid: 'Loss date cannot be after the notification date.',
  dateNotInFuture: 'Payment date cannot be in the future.',
};

/**
 * Resolves the first validation error message from a `ValidationErrors` map.
 *
 * Looks up the error key first in the `overrides` map, then falls back to
 * {@link DEFAULT_VALIDATION_MESSAGES}.  If the error value itself is a
 * string (as produced by custom validators), it is returned directly.
 *
 * @param {ValidationErrors | null} errors - The `AbstractControl.errors` map.
 * @param {Readonly<Record<string, string>>} overrides - Per-instance message overrides.
 * @returns {string} The first matching message, or `'This field is invalid.'` as a last resort.
 */
export function getValidationMessage(
  errors: ValidationErrors | null,
  overrides: Readonly<Record<string, string>>,
): string {
  if (!errors) {
    return '';
  }
  const firstError = Object.keys(errors)[0];
  if (!firstError) {
    return '';
  }
  if (overrides[firstError]) {
    return overrides[firstError];
  }
  const errVal = errors[firstError];
  if (typeof errVal === 'string') {
    return errVal;
  }
  return DEFAULT_VALIDATION_MESSAGES[firstError] ?? 'This field is invalid.';
}
