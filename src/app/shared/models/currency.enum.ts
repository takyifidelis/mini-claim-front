/** Supported currencies in the platform (Ghana Cedi, US Dollar, Euro). */
export type Currency = 'GHS' | 'USD' | 'EUR';

/** Ordered tuple of all supported currency codes. */
export const CURRENCIES: readonly Currency[] = ['GHS', 'USD', 'EUR'] as const;

/** Human-readable display labels for each supported currency. */
export const CURRENCY_LABELS: Record<Currency, string> = {
  GHS: 'GHS (GH₵) - Ghana Cedi',
  USD: 'USD ($) - US Dollar',
  EUR: 'EUR (€) - Euro',
};
