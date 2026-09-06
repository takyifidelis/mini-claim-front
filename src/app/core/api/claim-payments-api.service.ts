import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApiResponse,
  ClaimPayment,
  CreateClaimPaymentDto,
  PaginatedResponse,
  QueryClaimPaymentsDto,
} from '../../shared/models';
import { buildQueryParams } from '../../shared/utilities/query-params.builder';

/**
 * HTTP client service for the claim-payments API endpoints.
 *
 * All requests are scoped under `/claims/:claimId/payments`.
 */
@Injectable({
  providedIn: 'root',
})
export class ClaimPaymentsApiService {
  private readonly http = inject(HttpClient);

  /**
   * Retrieves a paginated list of payments for the given claim.
   *
   * @param {string} claimId - The unique identifier of the parent claim.
   * @param {QueryClaimPaymentsDto} [query] - Optional pagination/filter parameters.
   * @returns {Observable<PaginatedResponse<ClaimPayment>>} Paginated payment records.
   */
  getAll(
    claimId: string,
    query?: QueryClaimPaymentsDto,
  ): Observable<PaginatedResponse<ClaimPayment>> {
    const params = buildQueryParams(query as Record<string, unknown>);
    return this.http
      .get<ApiResponse<PaginatedResponse<ClaimPayment>>>(
        `${environment.apiUrl}/claims/${claimId}/payments`,
        { params },
      )
      .pipe(map((res) => res.data));
  }

  /**
   * Records a new payment against a claim.
   *
   * @param {string} claimId - The unique identifier of the parent claim.
   * @param {CreateClaimPaymentDto} dto - Payment details including date, amount, currency, and optional reference.
   * @returns {Observable<ClaimPayment>} The newly created payment record.
   */
  create(claimId: string, dto: CreateClaimPaymentDto): Observable<ClaimPayment> {
    return this.http
      .post<ApiResponse<ClaimPayment>>(`${environment.apiUrl}/claims/${claimId}/payments`, dto)
      .pipe(map((res) => res.data));
  }
}
