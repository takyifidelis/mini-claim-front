import { Currency } from './currency.enum';
import { PaginationQuery } from './pagination.model';
import { ExchangeRateSheetSummary } from './exchange-rate.model';

/** Lifecycle status of an insurance policy. */
export type PolicyStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED';

/** A single risk cover line attached to a policy, snapshotting catalogue data at creation time. */
export interface PolicyRiskCover {
  id: string;
  policyId: string;
  riskCoverId: string;
  /** Snapshot of the cover code at policy creation time. */
  coverCodeSnapshot: string;
  /** Snapshot of the cover name at policy creation time. */
  coverNameSnapshot: string;
  /** Maximum monetary amount payable under this cover. */
  coverageLimit: string;
  /** Deductible amount applied before payout calculation. */
  deductibleAmount: string;
  /** Optional bespoke terms for this cover line. */
  terms: string | null;
  createdAt: string;
  createdBy: string;
}

/** Lightweight policy record used in list views and claim form selectors. */
export interface PolicySummary {
  id: string;
  policyNumber: string;
  insuredName: string;
  policyType: string;
  /** ISO date string (YYYY-MM-DD). */
  startDate: string;
  /** ISO date string (YYYY-MM-DD). */
  endDate: string;
  /** Billing currency for all amounts on this policy. */
  currency: Currency;
  /** Premium amount; may be `null` if not yet set. */
  premiumAmount: string | null;
  /** Total sum insured across all covers. */
  sumInsured: string;
  /** Reference to the exchange rate sheet locked at policy creation. */
  exchangeRateSheetId: string;
  status: PolicyStatus;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

/** Full policy detail including its risk cover lines and the locked exchange rate sheet. */
export interface PolicyDetail extends PolicySummary {
  covers: PolicyRiskCover[];
  exchangeRateSheet?: ExchangeRateSheetSummary;
}

/** DTO for a single cover line when creating a policy. */
export interface CreatePolicyCoverDto {
  riskCoverId: string;
  coverageLimit: string;
  deductibleAmount?: string;
  terms?: string;
}

/** DTO for creating a new policy with its cover lines. */
export interface CreatePolicyDto {
  insuredName: string;
  policyType: string;
  startDate: string;
  endDate: string;
  currency: Currency;
  sumInsured: string;
  premiumAmount?: string;
  status?: PolicyStatus;
  covers: CreatePolicyCoverDto[];
}

/** Query parameters for the policies list endpoint. */
export interface QueryPoliciesDto extends PaginationQuery {
  currency?: Currency;
  status?: PolicyStatus;
}

/** UI filter state for the policies list component. */
export interface PolicyFilters {
  currency?: Currency | null;
  status?: PolicyStatus | null;
  search?: string;
}
