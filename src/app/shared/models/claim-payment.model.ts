import { Currency } from './currency.enum';
import { PaginationQuery } from './pagination.model';

/** A recorded payment applied against a claim. */
export interface ClaimPayment {
  id: string;
  claimId: string;
  /** ISO date string (YYYY-MM-DD) of when the payment was made. */
  paymentDate: string;
  /** Payment amount in the payment currency. */
  amount: string;
  /** Currency in which the payment was recorded. */
  currency: Currency;
  /** Exchange rate sheet used to convert the payment to the claim currency. */
  exchangeRateSheetId: string;
  /** Specific rate entry used, or `null` when payment and claim currencies match. */
  exchangeRateEntryId: string | null;
  /** The rate applied during conversion (4 decimal places). */
  appliedRate: string;
  /** Payment amount converted into the claim's billing currency. */
  amountInClaimCurrency: string;
  /** Optional payment reference / cheque number. */
  reference: string | null;
  createdAt: string;
  createdBy: string;
}

/** DTO for recording a new payment against a claim. */
export interface CreateClaimPaymentDto {
  /** ISO date string (YYYY-MM-DD). */
  paymentDate: string;
  amount: string;
  currency: Currency;
  reference?: string;
  /** Optimistic-lock version of the claim at the time of recording. */
  expectedVersion: number;
  /** Must be `true` when the payment would push the total paid above the approved payout. */
  confirmOverpayment?: boolean;
}

/** Query parameters for the claim payments list endpoint. */
export interface QueryClaimPaymentsDto extends PaginationQuery {}
