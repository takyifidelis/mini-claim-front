import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideStore } from '@ngxs/store';
import { describe, expect, it, beforeEach } from 'vitest';
import { of } from 'rxjs';
import { ExchangeRateListComponent } from './exchange-rate-list.component';
import { ExchangeRatesState } from '../../exchange-rates.state';
import { ExchangeRatesApiService } from '../../../../core/api/exchange-rates-api.service';

describe('ExchangeRateListComponent', () => {
  let component: ExchangeRateListComponent;
  let fixture: ComponentFixture<ExchangeRateListComponent>;

  beforeEach(async () => {
    const rateSheet = {
      id: 'fx-1',
      reference: 'FX-001',
      effectiveAt: '2026-01-01',
      notes: 'Central bank rates',
      createdAt: '2026-01-01',
      createdBy: 'system',
    };
    const mockExchangeRatesApi = {
      getAll: () => of({ items: [rateSheet], totalItems: 1, page: 1, pageSize: 10, totalPages: 1 }),
      getCurrent: () =>
        of({
          ...rateSheet,
          entries: [
            {
              id: '1',
              exchangeRateSheetId: 'fx-1',
              fromCurrency: 'USD',
              toCurrency: 'GHS',
              rate: '15.5000',
            },
            {
              id: '2',
              exchangeRateSheetId: 'fx-1',
              fromCurrency: 'EUR',
              toCurrency: 'GHS',
              rate: '16.8000',
            },
          ],
        }),
      create: () => of({}),
    };

    await TestBed.configureTestingModule({
      imports: [ExchangeRateListComponent],
      providers: [
        provideRouter([]),
        provideStore([ExchangeRatesState]),
        { provide: ExchangeRatesApiService, useValue: mockExchangeRatesApi },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ExchangeRateListComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create and pre-fill GHS exchange rate inputs from current active rate sheet with 4 decimal places', () => {
    expect(component).toBeTruthy();
    expect((component as any).rateForm.get('usdRate')?.value).toBe('15.5000');
    expect((component as any).rateForm.get('eurRate')?.value).toBe('16.8000');
  });

  it('should compute live bidirectional conversion preview with 4 decimal places', () => {
    const preview = (component as any).ratePreview();
    expect(preview).toBeTruthy();
    expect(preview.usdToGhs).toBe('15.5000');
    expect(preview.eurToGhs).toBe('16.8000');
    expect(Number(preview.ghsToUsd)).toBeCloseTo(0.0645, 2);
    expect(Number(preview.ghsToEur)).toBeCloseTo(0.0595, 2);
  });
});
