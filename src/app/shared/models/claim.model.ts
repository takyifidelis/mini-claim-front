import { Currency } from './currency.enum';
import { PaginationQuery, PaginatedResponse } from './pagination.model';

/** Possible decisions on a claim review. */
export type ReviewDecision = 'APPROVED' | 'DENIED';

/**
 * Computed claim lifecycle status derived server-side from review decision and payment state.
 *
 * Lifecycle:
 * `UNDER_REVIEW` → (`APPROVED`) → `RESERVED_NOT_SETTLED` → `PAYMENT_OUTSTANDING` → `PAID`
 * `UNDER_REVIEW` → (`DENIED`) → `DENIED`
 */
export type DerivedClaimStatus =
  'UNDER_REVIEW' | 'DENIED' | 'RESERVED_NOT_SETTLED' | 'PAYMENT_OUTSTANDING' | 'PAID';

/** Human-readable labels for each derived claim status used by pipes and badges. */
export const CLAIM_STATUS_LABELS: Record<DerivedClaimStatus, string> = {
  UNDER_REVIEW: 'Under Review',
  DENIED: 'Denied',
  RESERVED_NOT_SETTLED: 'Reserved - Not Settled',
  PAYMENT_OUTSTANDING: 'Payment Outstanding',
  PAID: 'Paid',
};

/** A claim review decision record attached to a claim. */
export interface ClaimReview {
  id: string;
  decision: ReviewDecision;
  reason: string;
  /** ISO timestamp of when the review was submitted. */
  reviewedAt: string;
  reviewedBy: string;
}

/** Aggregated monetary totals for claims filtered by currency, returned with paginated list responses. */
export interface CurrencyTotals {
  currency: Currency;
  totalEstimatedLoss: string;
  totalApprovedPayout: string;
  totalPaid: string;
  /** Positive = outstanding balance; negative = overpaid amount. */
  signedOutstandingBalance: string;
  /** Number of claims in the group that have no approved payout set. */
  unapprovedCount: number;
  totalClaims: number;
}

/** Lightweight claim record used in list views. */
export interface ClaimSummary {
  id: string;
  claimReference: string;
  policyId: string;
  policyNumber: string;
  insuredName: string;
  policyRiskCoverId: string;
  /** Cover code captured at claim creation time. */
  coverCodeSnapshot: string;
  /** Cover name captured at claim creation time. */
  coverNameSnapshot: string;
  currency: Currency;
  /** ISO date string (YYYY-MM-DD). */
  lossDate: string;
  /** ISO date string (YYYY-MM-DD). */
  dateNotified: string;
  lossNature: string;
  estimatedLossAmount: string;
  /** Set after a review decision of APPROVED; `null` until then. */
  approvedPayoutAmount: string | null;
  /** Running total of all recorded payments in the claim currency. */
  totalPaid: string;
  /** `approvedPayoutAmount - totalPaid`; negative indicates overpayment. Null until payout is approved. */
  outstandingBalance: string | null;
  /** Non-null when total paid exceeds approved payout. */
  overpaidAmount: string | null;
  status: DerivedClaimStatus;
  /** Optimistic-lock counter incremented on every mutation. */
  version: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  review?: ClaimReview | null;
}

/** Full claim detail including coverage limits and deductible from the policy cover snapshot. */
export interface ClaimDetail extends ClaimSummary {
  coverageLimit: string;
  deductibleAmount: string;
  coverTerms?: string | null;
}

/** DTO for registering a new claim. */
export interface CreateClaimDto {
  policyId: string;
  policyRiskCoverId: string;
  /** ISO date string (YYYY-MM-DD). */
  lossDate: string;
  /** ISO date string (YYYY-MM-DD). */
  dateNotified: string;
  lossNature: string;
  estimatedLossAmount: string;
}

/**
 * DTO for updating mutable claim facts.
 * Only allowed while the claim is in `UNDER_REVIEW` status.
 */
export interface UpdateClaimDto {
  /** Current optimistic-lock version; prevents concurrent mutation conflicts. */
  expectedVersion: number;
  lossDate?: string;
  dateNotified?: string;
  lossNature?: string;
  estimatedLossAmount?: string;
}

/** DTO for submitting an APPROVED or DENIED review decision. */
export interface CreateClaimReviewDto {
  expectedVersion: number;
  decision: ReviewDecision;
  reason: string;
}

/** DTO for setting or updating the approved payout amount. */
export interface UpdateApprovedPayoutDto {
  approvedPayoutAmount: string;
  expectedVersion: number;
  /** Required when the new payout amount would result in an overpayment. */
  confirmOverpayment?: boolean;
}

/** DTO for clearing the approved payout amount, reverting to UNDER_REVIEW. */
export interface ClearApprovedPayoutDto {
  expectedVersion: number;
}

/** Query parameters for the claims list endpoint. */
export interface QueryClaimsDto extends PaginationQuery {
  /** Filter to claims notified on or after this ISO date. */
  dateNotifiedFrom?: string;
  /** Filter to claims notified on or before this ISO date. */
  dateNotifiedTo?: string;
  status?: DerivedClaimStatus;
  currency?: Currency;
  /** Scope to claims under a specific policy. */
  policyId?: string;
  policyRiskCoverId?: string;
}

/** UI filter state for the claims list components. */
export interface ClaimFilters {
  search?: string;
  dateNotifiedFrom?: string | null;
  dateNotifiedTo?: string | null;
  status?: DerivedClaimStatus | null;
  currency?: Currency | null;
  policyId?: string | null;
}

/** Extended paginated response for claims, including per-currency monetary aggregates. */
export interface PaginatedClaimsResponse extends PaginatedResponse<ClaimSummary> {
  totalsByCurrency: CurrencyTotals[];
}
