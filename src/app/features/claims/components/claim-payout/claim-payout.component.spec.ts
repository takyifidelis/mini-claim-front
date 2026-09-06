import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { provideStore } from '@ngxs/store';
import { describe, expect, it, beforeEach } from 'vitest';
import { of } from 'rxjs';
import { ClaimPayoutComponent } from './claim-payout.component';
import { ClaimsState } from '../../claims.state';
import { ClaimsApiService } from '../../../../core/api/claims-api.service';
import { ClaimPaymentsApiService } from '../../../../core/api/claim-payments-api.service';
import { PoliciesApiService } from '../../../../core/api/policies-api.service';
import { ExchangeRatesApiService } from '../../../../core/api/exchange-rates-api.service';

describe('ClaimPayoutComponent', () => {
  let component: ClaimPayoutComponent;
  let fixture: ComponentFixture<ClaimPayoutComponent>;

  const payment = {
    id: 'pay-1',
    claimId: 'clm-1',
    paymentDate: '2026-01-03',
    amount: '1000.00',
    currency: 'USD',
    exchangeRateSheetId: 'ex-1',
    exchangeRateEntryId: null,
    appliedRate: '1.0000',
    amountInClaimCurrency: '1000.00',
    reference: 'BANK-001',
    createdAt: '2026-01-03T10:00:00.000Z',
    createdBy: 'user',
  };

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
          totalPaid: '0.00',
          outstandingBalance: '4500.00',
          overpaidAmount: null,
          status: 'RESERVED_NOT_SETTLED',
          coverageLimit: '20000.00',
          deductibleAmount: '0.00',
          version: 1,
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
          createdBy: 'user',
        }),
      setApprovedPayout: () => of({}),
      clearApprovedPayout: () => of({}),
    };

    await TestBed.configureTestingModule({
      imports: [ClaimPayoutComponent],
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
            getAll: () =>
              of({ items: [payment], totalItems: 1, page: 1, pageSize: 10, totalPages: 1 }),
          },
        },
        { provide: PoliciesApiService, useValue: { getById: () => of({ id: 'pol-1' }) } },
        { provide: ExchangeRatesApiService, useValue: { getById: () => of({ id: 'ex-1' }) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ClaimPayoutComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create and populate payout form', () => {
    expect(component).toBeTruthy();
    expect((component as any).canClearPayout()).toBe(true);
  });

  it('shows the claim payment history below the payout form', () => {
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent as string;
    expect(content.indexOf('Payment History (1)')).toBeGreaterThan(
      content.indexOf('Set Approved Payout Amount'),
    );
    expect(content).toContain('BANK-001');
  });
});
