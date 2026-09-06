import { describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ExchangeRatesState } from './exchange-rates.state';
import { ExchangeRateSheetDetail, ExchangeRateSheetSummary } from '../../shared/models';
import { ExchangeRatesApiService } from '../../core/api/exchange-rates-api.service';

describe('ExchangeRatesState', () => {
  const mockSheetSummary: ExchangeRateSheetSummary = {
    id: 'fx-1',
    reference: 'FX-20260905-000001',
    effectiveAt: '2026-09-05T00:00:00.000Z',
    notes: 'Central bank rates',
    usdToGhsRate: '15.50000000',
    eurToGhsRate: '16.80000000',
    createdAt: '2026-09-05T00:00:00.000Z',
    createdBy: 'system',
  };

  const mockSheetDetail: ExchangeRateSheetDetail = {
    ...mockSheetSummary,
    entries: [
      {
        id: 'e1',
        exchangeRateSheetId: 'fx-1',
        fromCurrency: 'USD',
        toCurrency: 'GHS',
        rate: '15.5000',
      },
      {
        id: 'e2',
        exchangeRateSheetId: 'fx-1',
        fromCurrency: 'GHS',
        toCurrency: 'USD',
        rate: '0.0645',
      },
    ],
  };

  it('should load list of exchange rate sheets', async () => {
    const mockApi = {
      getAll: vi.fn().mockReturnValue(
        of({
          items: [mockSheetSummary],
          totalItems: 1,
          page: 1,
          pageSize: 10,
          totalPages: 1,
        }),
      ),
      getCurrent: vi.fn(),
      getById: vi.fn(),
      create: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: ExchangeRatesApiService, useValue: mockApi }],
    });

    const state = TestBed.runInInjectionContext(() => new ExchangeRatesState());

    let patched: any = null;
    const ctx = {
      getState: () => ({
        items: [],
        total: 0,
        page: 1,
        pageSize: 10,
        sortField: 'effectiveAt',
        sortDirection: 'desc' as const,
        filters: { search: '' },
        loading: false,
        error: null,
        currentSheet: null,
        selectedSheet: null,
        mutating: false,
      }),
      patchState: (val: any) => {
        patched = val;
      },
      dispatch: vi.fn(),
    };

    await (state.loadExchangeRates(ctx as any) as any).toPromise();

    expect(mockApi.getAll).toHaveBeenCalled();
    expect(patched).toEqual({
      items: [mockSheetSummary],
      total: 1,
      loading: false,
      error: null,
    });
  });

  it('should load current exchange rate sheet', async () => {
    const mockApi = {
      getAll: vi.fn(),
      getCurrent: vi.fn().mockReturnValue(of(mockSheetDetail)),
      getById: vi.fn(),
      create: vi.fn(),
    };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [{ provide: ExchangeRatesApiService, useValue: mockApi }],
    });

    const state = TestBed.runInInjectionContext(() => new ExchangeRatesState());

    let patched: any = null;
    const ctx = {
      patchState: (val: any) => {
        patched = val;
      },
    };

    await (state.loadCurrentExchangeRate(ctx as any) as any).toPromise();

    expect(mockApi.getCurrent).toHaveBeenCalled();
    expect(patched).toEqual({ currentSheet: mockSheetDetail, error: null });
  });
});
