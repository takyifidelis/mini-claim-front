import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApiResponse,
  CreatePolicyDto,
  PaginatedResponse,
  PolicyDetail,
  PolicySummary,
  QueryPoliciesDto,
} from '../../shared/models';
import { buildQueryParams } from '../../shared/utilities/query-params.builder';

/**
 * HTTP client service for the policies API endpoints.
 *
 * Provides CRUD operations and a lightweight options list used to populate
 * selectors in claim and policy forms.
 */
@Injectable({
  providedIn: 'root',
})
export class PoliciesApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/policies`;

  /**
   * Retrieves a paginated list of policy summaries.
   *
   * @param {QueryPoliciesDto} [query] - Optional filter, sort, and pagination parameters.
   * @returns {Observable<PaginatedResponse<PolicySummary>>} Paginated policy summary records.
   */
  getAll(query?: QueryPoliciesDto): Observable<PaginatedResponse<PolicySummary>> {
    const params = buildQueryParams(query as Record<string, unknown>);
    return this.http
      .get<ApiResponse<PaginatedResponse<PolicySummary>>>(this.baseUrl, { params })
      .pipe(map((res) => res.data));
  }

  /**
   * Retrieves a flat list of all active policies for use in select dropdowns.
   *
   * @returns {Observable<PolicySummary[]>} Lightweight array of policy summaries (no pagination).
   */
  getOptions(): Observable<PolicySummary[]> {
    return this.http
      .get<ApiResponse<PolicySummary[]>>(`${this.baseUrl}/options`)
      .pipe(map((res) => res.data));
  }

  /**
   * Retrieves full policy detail including its risk covers and exchange rate sheet.
   *
   * @param {string} id - The policy's unique identifier.
   * @returns {Observable<PolicyDetail>} Full policy detail with covers and exchange rate sheet.
   */
  getById(id: string): Observable<PolicyDetail> {
    return this.http
      .get<ApiResponse<PolicyDetail>>(`${this.baseUrl}/${id}`)
      .pipe(map((res) => res.data));
  }

  /**
   * Creates a new policy with its associated risk covers.
   *
   * @param {CreatePolicyDto} dto - Policy data including insured details, dates, currency, and covers.
   * @returns {Observable<PolicyDetail>} The newly created policy detail.
   */
  create(dto: CreatePolicyDto): Observable<PolicyDetail> {
    return this.http
      .post<ApiResponse<PolicyDetail>>(this.baseUrl, dto)
      .pipe(map((res) => res.data));
  }
}
