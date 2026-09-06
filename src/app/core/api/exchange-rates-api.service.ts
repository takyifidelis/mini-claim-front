import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApiResponse,
  CreateExchangeRateSheetDto,
  ExchangeRateSheetDetail,
  ExchangeRateSheetSummary,
  PaginatedResponse,
  QueryExchangeRateSheetsDto,
} from '../../shared/models';
import { buildQueryParams } from '../../shared/utilities/query-params.builder';

/**
 * HTTP client service for the exchange-rate-sheets API endpoints.
 *
 * Each sheet contains up to 6 bidirectional GHS/USD/EUR rate entries derived
 * from two GHS-base rates (Bank of Ghana 4 decimal-place standard).
 */
@Injectable({
  providedIn: 'root',
})
export class ExchangeRatesApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/exchange-rate-sheets`;

  /**
   * Retrieves a paginated list of exchange rate sheet summaries.
   *
   * @param {QueryExchangeRateSheetsDto} [query] - Optional pagination and search parameters.
   * @returns {Observable<PaginatedResponse<ExchangeRateSheetSummary>>} Paginated sheet summaries.
   */
  getAll(
    query?: QueryExchangeRateSheetsDto,
  ): Observable<PaginatedResponse<ExchangeRateSheetSummary>> {
    const params = buildQueryParams(query as Record<string, unknown>);
    return this.http
      .get<ApiResponse<PaginatedResponse<ExchangeRateSheetSummary>>>(this.baseUrl, { params })
      .pipe(map((res) => res.data));
  }

  /**
   * Retrieves the currently active exchange rate sheet (most recent by `effectiveAt`).
   *
   * @returns {Observable<ExchangeRateSheetDetail>} The active sheet with all its rate entries.
   */
  getCurrent(): Observable<ExchangeRateSheetDetail> {
    return this.http
      .get<ApiResponse<ExchangeRateSheetDetail>>(`${this.baseUrl}/current`)
      .pipe(map((res) => res.data));
  }

  /**
   * Retrieves a single exchange rate sheet by ID.
   *
   * @param {string} id - The sheet's unique identifier.
   * @returns {Observable<ExchangeRateSheetDetail>} Full sheet detail including all rate entries.
   */
  getById(id: string): Observable<ExchangeRateSheetDetail> {
    return this.http
      .get<ApiResponse<ExchangeRateSheetDetail>>(`${this.baseUrl}/${id}`)
      .pipe(map((res) => res.data));
  }

  /**
   * Creates and activates a new exchange rate sheet.
   * The new sheet immediately becomes the active sheet for future policy conversions.
   *
   * @param {CreateExchangeRateSheetDto} dto - Sheet data including effective date and rate entries.
   * @returns {Observable<ExchangeRateSheetDetail>} The newly created and activated sheet detail.
   */
  create(dto: CreateExchangeRateSheetDto): Observable<ExchangeRateSheetDetail> {
    return this.http
      .post<ApiResponse<ExchangeRateSheetDetail>>(this.baseUrl, dto)
      .pipe(map((res) => res.data));
  }
}
