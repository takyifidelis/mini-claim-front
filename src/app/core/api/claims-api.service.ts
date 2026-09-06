import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApiResponse,
  ClaimDetail,
  ClearApprovedPayoutDto,
  CreateClaimDto,
  CreateClaimReviewDto,
  PaginatedClaimsResponse,
  QueryClaimsDto,
  UpdateApprovedPayoutDto,
  UpdateClaimDto,
} from '../../shared/models';
import { buildQueryParams } from '../../shared/utilities/query-params.builder';

/**
 * HTTP client service for the claims API endpoints.
 *
 * Supports CRUD operations, claim review submission, approved payout management,
 * and approved payout clearing.
 */
@Injectable({
  providedIn: 'root',
})
export class ClaimsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/claims`;

  /**
   * Retrieves a paginated, filtered list of claims including per-currency totals.
   *
   * @param {QueryClaimsDto} [query] - Optional filter, sort, and pagination parameters.
   * @returns {Observable<PaginatedClaimsResponse>} Paginated claims with `totalsByCurrency` aggregates.
   */
  getAll(query?: QueryClaimsDto): Observable<PaginatedClaimsResponse> {
    const params = buildQueryParams(query as Record<string, unknown>);
    return this.http
      .get<ApiResponse<PaginatedClaimsResponse>>(this.baseUrl, { params })
      .pipe(map((res) => res.data));
  }

  /**
   * Retrieves the full detail of a single claim.
   *
   * @param {string} id - The claim's unique identifier.
   * @returns {Observable<ClaimDetail>} Full claim detail including coverage and review data.
   */
  getById(id: string): Observable<ClaimDetail> {
    return this.http
      .get<ApiResponse<ClaimDetail>>(`${this.baseUrl}/${id}`)
      .pipe(map((res) => res.data));
  }

  /**
   * Registers a new claim against a policy risk cover.
   *
   * @param {CreateClaimDto} dto - Claim registration data including policy, cover, dates, and estimated loss.
   * @returns {Observable<ClaimDetail>} The newly created claim detail.
   */
  create(dto: CreateClaimDto): Observable<ClaimDetail> {
    return this.http.post<ApiResponse<ClaimDetail>>(this.baseUrl, dto).pipe(map((res) => res.data));
  }

  /**
   * Updates mutable claim facts (loss date, notification date, loss nature, estimated loss).
   * Only allowed while the claim is in `UNDER_REVIEW` status.
   *
   * @param {string} id - The claim's unique identifier.
   * @param {UpdateClaimDto} dto - Fields to update along with the expected optimistic-lock version.
   * @returns {Observable<ClaimDetail>} The updated claim detail.
   */
  update(id: string, dto: UpdateClaimDto): Observable<ClaimDetail> {
    return this.http
      .patch<ApiResponse<ClaimDetail>>(`${this.baseUrl}/${id}`, dto)
      .pipe(map((res) => res.data));
  }

  /**
   * Submits an APPROVED or DENIED review decision for a claim.
   *
   * @param {string} id - The claim's unique identifier.
   * @param {CreateClaimReviewDto} dto - Review decision, reason, and expected version.
   * @returns {Observable<ClaimDetail>} The updated claim detail reflecting the review outcome.
   */
  createReview(id: string, dto: CreateClaimReviewDto): Observable<ClaimDetail> {
    return this.http
      .post<ApiResponse<ClaimDetail>>(`${this.baseUrl}/${id}/review`, dto)
      .pipe(map((res) => res.data));
  }

  /**
   * Sets or updates the approved payout amount for a claim.
   * Requires an explicit overpayment confirmation flag when the amount is below total paid.
   *
   * @param {string} id - The claim's unique identifier.
   * @param {UpdateApprovedPayoutDto} dto - New approved payout amount and expected version.
   * @returns {Observable<ClaimDetail>} The updated claim detail.
   */
  setApprovedPayout(id: string, dto: UpdateApprovedPayoutDto): Observable<ClaimDetail> {
    return this.http
      .put<ApiResponse<ClaimDetail>>(`${this.baseUrl}/${id}/approved-payout`, dto)
      .pipe(map((res) => res.data));
  }

  /**
   * Clears the approved payout amount, reverting the claim to `UNDER_REVIEW` status.
   * Only allowed when total payments recorded against the claim are zero.
   *
   * @param {string} id - The claim's unique identifier.
   * @param {ClearApprovedPayoutDto} dto - Expected optimistic-lock version.
   * @returns {Observable<ClaimDetail>} The updated claim detail after clearing the payout.
   */
  clearApprovedPayout(id: string, dto: ClearApprovedPayoutDto): Observable<ClaimDetail> {
    return this.http
      .delete<ApiResponse<ClaimDetail>>(`${this.baseUrl}/${id}/approved-payout`, {
        body: dto,
      })
      .pipe(map((res) => res.data));
  }
}
