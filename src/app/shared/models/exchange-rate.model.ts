import { Currency } from './currency.enum';
import { PaginationQuery } from './pagination.model';

/** A single bidirectional rate entry within an exchange rate sheet. */
export interface ExchangeRateEntry {
  id: string;
  exchangeRateSheetId: string;
  fromCurrency: Currency;
  toCurrency: Currency;
  /** Decimal string with up to 4 decimal places (Bank of Ghana standard). */
  rate: string;
}

/** Lightweight exchange rate sheet record used in list views and policy references. */
export interface ExchangeRateSheetSummary {
  id: string;
  /** Human-readable sheet reference, e.g. `FX-20260905-000001`. */
  reference: string;
  /** ISO timestamp indicating when the rates become effective. */
  effectiveAt: string;
  notes: string | null;
  /** Convenience field: USD-to-GHS rate stored on the sheet. */
  usdToGhsRate?: string | null;
  /** Convenience field: EUR-to-GHS rate stored on the sheet. */
  eurToGhsRate?: string | null;
  createdAt: string;
  createdBy: string;
}

/** Full exchange rate sheet detail including all 6 bidirectional rate entries. */
export interface ExchangeRateSheetDetail extends ExchangeRateSheetSummary {
  entries: ExchangeRateEntry[];
}

/** DTO for creating a single rate entry within a new sheet. */
export interface CreateExchangeRateEntryDto {
  fromCurrency: Currency;
  toCurrency: Currency;
  rate: string;
}

/** DTO for creating a new exchange rate sheet with base rates. */
export interface CreateExchangeRateSheetDto {
  /** ISO timestamp for when the sheet becomes effective. */
  effectiveAt: string;
  /** GHS value of one USD (Bank of Ghana 4-decimal standard, e.g. "15.5039"). */
  usdToGhsRate: string;
  /** GHS value of one EUR (Bank of Ghana 4-decimal standard, e.g. "16.8067"). */
  eurToGhsRate: string;
  /** Optional description or notes for this rate sheet. */
  notes?: string;
}

/** Query parameters for the exchange rate sheets list endpoint. */
export interface QueryExchangeRateSheetsDto extends PaginationQuery {}

/** UI filter state for the exchange rates list component. */
export interface ExchangeRateFilters {
  /** Free-text search term. */
  search?: string;
}
