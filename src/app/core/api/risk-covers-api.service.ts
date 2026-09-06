import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApiResponse,
  CreateRiskCoverDto,
  PaginatedResponse,
  QueryRiskCoversDto,
  RiskCover,
} from '../../shared/models';
import { buildQueryParams } from '../../shared/utilities/query-params.builder';

/**
 * HTTP client service for the risk-covers API endpoints.
 *
 * Risk covers are the catalogue of peril types that can be attached to policies.
 */
@Injectable({
  providedIn: 'root',
})
export class RiskCoversApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/risk-covers`;

  /**
   * Retrieves a paginated list of risk covers.
   *
   * @param {QueryRiskCoversDto} [query] - Optional filter, sort, and pagination parameters.
   * @returns {Observable<PaginatedResponse<RiskCover>>} Paginated risk cover records.
   */
  getAll(query?: QueryRiskCoversDto): Observable<PaginatedResponse<RiskCover>> {
    const params = buildQueryParams(query as Record<string, unknown>);
    return this.http
      .get<ApiResponse<PaginatedResponse<RiskCover>>>(this.baseUrl, { params })
      .pipe(map((res) => res.data));
  }

  /**
   * Retrieves a flat list of all active risk covers for use in select dropdowns.
   *
   * @returns {Observable<RiskCover[]>} Lightweight array of risk covers (no pagination).
   */
  getOptions(): Observable<RiskCover[]> {
    return this.http
      .get<ApiResponse<RiskCover[]>>(`${this.baseUrl}/options`)
      .pipe(map((res) => res.data));
  }

  /**
   * Retrieves a single risk cover by ID.
   *
   * @param {string} id - The risk cover's unique identifier.
   * @returns {Observable<RiskCover>} The full risk cover record.
   */
  getById(id: string): Observable<RiskCover> {
    return this.http
      .get<ApiResponse<RiskCover>>(`${this.baseUrl}/${id}`)
      .pipe(map((res) => res.data));
  }

  /**
   * Creates a new risk cover in the catalogue.
   *
   * @param {CreateRiskCoverDto} dto - Risk cover data including code, name, description, and initial status.
   * @returns {Observable<RiskCover>} The newly created risk cover record.
   */
  create(dto: CreateRiskCoverDto): Observable<RiskCover> {
    return this.http.post<ApiResponse<RiskCover>>(this.baseUrl, dto).pipe(map((res) => res.data));
  }
}
