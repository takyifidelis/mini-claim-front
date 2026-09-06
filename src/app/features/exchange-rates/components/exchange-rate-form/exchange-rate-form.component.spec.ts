import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideStore } from '@ngxs/store';
import { describe, expect, it, beforeEach } from 'vitest';
import { of } from 'rxjs';
import { ExchangeRateFormComponent } from './exchange-rate-form.component';
import { ExchangeRatesState } from '../../exchange-rates.state';
import { ExchangeRatesApiService } from '../../../../core/api/exchange-rates-api.service';

describe('ExchangeRateFormComponent', () => {
  let component: ExchangeRateFormComponent;
  let fixture: ComponentFixture<ExchangeRateFormComponent>;

  beforeEach(async () => {
    const mockExchangeRatesApi = {
      getAll: () => of({ items: [], totalItems: 0, page: 1, pageSize: 10, totalPages: 0 }),
      getCurrent: () => of(null),
      create: () => of({ id: 'fx-new' }),
    };

    await TestBed.configureTestingModule({
      imports: [ExchangeRateFormComponent],
      providers: [
        provideRouter([]),
        provideStore([ExchangeRatesState]),
        { provide: ExchangeRatesApiService, useValue: mockExchangeRatesApi },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ExchangeRateFormComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create with 2 rate fields for GHS base', () => {
    expect(component).toBeTruthy();
    expect((component as any).form.contains('usdRate')).toBe(true);
    expect((component as any).form.contains('eurRate')).toBe(true);
  });
});
