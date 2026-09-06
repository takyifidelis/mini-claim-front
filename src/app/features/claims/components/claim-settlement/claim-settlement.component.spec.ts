import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { provideStore } from '@ngxs/store';
import { describe, expect, it, beforeEach } from 'vitest';
import { of } from 'rxjs';
import { ClaimSettlementComponent } from './claim-settlement.component';
import { ClaimsState } from '../../claims.state';
import { ClaimsApiService } from '../../../../core/api/claims-api.service';
import { ClaimPaymentsApiService } from '../../../../core/api/claim-payments-api.service';
import { PoliciesApiService } from '../../../../core/api/policies-api.service';
import { ExchangeRatesApiService } from '../../../../core/api/exchange-rates-api.service';

describe('ClaimSettlementComponent', () => {
  let component: ClaimSettlementComponent;
  let fixture: ComponentFixture<ClaimSettlementComponent>;

  beforeEach(async () => {
    const mockClaimsApi = {
      getById: () =>
        of({
          id: 'clm-1',
          claimReference: 'CLM-2026-000001',
          policyId: 'pol-1',
          policyNumber: 'POL-001',
          insuredName: 'Acme',
          coverCodeSnapshot: 'FIRE',
          coverNameSnapshot: 'Fire',
          currency: 'USD',
          lossDate: '2026-01-01',
          dateNotified: '2026-01-02',
          lossNature: 'Fire outbreak',
          estimatedLossAmount: '5000.00',
          approvedPayoutAmount: '4500.00',
          totalPaid: '1000.00',
          outstandingBalance: '3500.00',
          overpaidAmount: null,
          status: 'PAYMENT_OUTSTANDING',
          coverageLimit: '20000.00',
          deductibleAmount: '0.00',
          version: 1,
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
          createdBy: 'user',
        }),
    };

    await TestBed.configureTestingModule({
      imports: [ClaimSettlementComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ id: 'clm-1' }),
            },
          },
        },
        provideStore([ClaimsState]),
        { provide: ClaimsApiService, useValue: mockClaimsApi },
        {
          provide: ClaimPaymentsApiService,
          useValue: {
            getAll: () => of({ items: [], totalItems: 0, page: 1, pageSize: 10 }),
            create: () => of({}),
          },
        },
        { provide: PoliciesApiService, useValue: { getById: () => of({ id: 'pol-1' }) } },
        { provide: ExchangeRatesApiService, useValue: { getById: () => of({ id: 'ex-1' }) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ClaimSettlementComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create and verify overpaid helper', () => {
    expect(component).toBeTruthy();
    expect((component as any).isOverpaid('-100.00')).toBe(true);
    expect((component as any).isOverpaid('100.00')).toBe(false);
  });
});
