import { PaginationQuery } from './pagination.model';

/** Lifecycle status of a risk cover catalogue entry. */
export type RiskCoverStatus = 'ACTIVE' | 'INACTIVE';

/** A single risk cover (peril type) from the product catalogue. */
export interface RiskCover {
  /** UUID primary key. */
  id: string;
  /** Short unique code, e.g. `ACC_DAMAGE`. */
  code: string;
  /** Display name shown in the UI. */
  name: string;
  /** Detailed description of what the cover protects against. */
  description: string;
  /** Whether the cover is available for new policies. */
  status: RiskCoverStatus;
  /** ISO timestamp of when the record was created. */
  createdAt: string;
  /** Username of the user who created the record. */
  createdBy: string;
}

/** DTO for creating a new risk cover catalogue entry. */
export interface CreateRiskCoverDto {
  code: string;
  name: string;
  description: string;
  /** Defaults to `ACTIVE` when omitted. */
  status?: RiskCoverStatus;
}

/** Query parameters for the risk covers list endpoint. */
export interface QueryRiskCoversDto extends PaginationQuery {
  /** Filter by lifecycle status. */
  status?: RiskCoverStatus;
}

/** UI filter state for the risk covers list component. */
export interface RiskCoverFilters {
  /** Filter by lifecycle status; `null` means no filter. */
  status?: RiskCoverStatus | null;
  /** Free-text search term. */
  search?: string;
}
