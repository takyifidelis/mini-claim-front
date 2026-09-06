import { describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ClearClaimsFilter, ClaimsState, LoadClaims, SubmitClaimReview } from './claims.state';
import { ClaimDetail, ClaimSummary, CurrencyTotals } from '../../shared/models';
import { ClaimsApiService } from '../../core/api/claims-api.service';
import { ClaimPaymentsApiService } from '../../core/api/claim-payments-api.service';
import { PoliciesApiService } from '../../core/api/policies-api.service';
import { ExchangeRatesApiService } from '../../core/api/exchange-rates-api.service';

describe('ClaimsState', () => {
  const mockTotals: CurrencyTotals[] = [
    {
      currency: 'USD',
      totalEstimatedLoss: '15000.00',
      totalApprovedPayout: '12000.00',
      totalPaid: '5000.00',
      signedOutstandingBalance: '7000.00',
      unapprovedCount: 0,
      totalClaims: 1,
    },
  ];

  const mockClaimSummary: ClaimSummary = {
    id: 'clm-1',
    claimReference: 'CLM-2026-000001',
    policyId: 'pol-1',
    policyNumber: 'POL-2026-000001',
    insuredName: 'Acme Ltd',
    policyRiskCoverId: 'prc-1',
    coverCodeSnapshot: 'ACC_DAMAGE',
    coverNameSnapshot: 'Accidental Damage',
    currency: 'USD',
    lossDate: '2026-03-15',
    dateNotified: '2026-03-16',
    lossNature: 'Collision damage',
    estimatedLossAmount: '15000.00',
    approvedPayoutAmount: '12000.00',
    totalPaid: '5000.00',
    outstandingBalance: '7000.00',
    overpaidAmount: '0.00',
    status: 'PAYMENT_OUTSTANDING',
    version: 1,
    createdAt: '2026-09-05T00:00:00.000Z',
    updatedAt: '2026-09-05T00:00:00.000Z',
    createdBy: 'demo_user',
  };

  const mockClaimDetail: ClaimDetail = {
    ...mockClaimSummary,
    coverageLimit: '50000.00',
    deductibleAmount: '500.00',
    coverTerms: 'Subject to 10% deductible',
  };

  it('should reset stale list filters before applying a list-specific status', () => {
    const mockApi = {
      getAll: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: ClaimsApiService, useValue: mockApi },
        { provide: ClaimPaymentsApiService, useValue: {} },
        { provide: PoliciesApiService, useValue: {} },
        { provide: ExchangeRatesApiService, useValue: {} },
      ],
    });

    const state = TestBed.runInInjectionContext(() => new ClaimsState());
    const patchState = vi.fn();
    const dispatch = vi.fn().mockReturnValue(of(undefined));
    const ctx = { patchState, dispatch };

    state.clearFilter(ctx as never, new ClearClaimsFilter({ status: 'UNDER_REVIEW' }));

    expect(patchState).toHaveBeenCalledWith({
      filters: {
        search: '',
        dateNotifiedFrom: null,
        dateNotifiedTo: null,
        status: 'UNDER_REVIEW',
        currency: null,
        policyId: null,
      },
      page: 1,
    });
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith(expect.any(LoadClaims));
  });

  it('should load list of claims with totalsByCurrency', async () => {
    const mockApi = {
      getAll: vi.fn().mockReturnValue(
        of({
          items: [mockClaimSummary],
          totalItems: 1,
          page: 1,
          pageSize: 10,
          totalPages: 1,
          totalsByCurrency: mockTotals,
        }),
      ),
      getById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      createReview: vi.fn(),
      setApprovedPayout: vi.fn(),
      clearApprovedPayout: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: ClaimsApiService, useValue: mockApi },
        { provide: ClaimPaymentsApiService, useValue: {} },
        { provide: PoliciesApiService, useValue: {} },
        { provide: ExchangeRatesApiService, useValue: {} },
      ],
    });

    const state = TestBed.runInInjectionContext(() => new ClaimsState());

    let patched: any = null;
    const ctx = {
      getState: () => ({
        items: [],
        total: 0,
        page: 1,
        pageSize: 10,
        sortField: 'createdAt',
        sortDirection: 'desc' as const,
        filters: {
          search: '',
          dateNotifiedFrom: null,
          dateNotifiedTo: null,
          status: null,
          currency: null,
          policyId: null,
        },
        totalsByCurrency: [],
        loading: false,
        error: null,
        selectedClaim: null,
        selectedPolicy: null,
        lockedExchangeRate: null,
        payments: [],
        paymentsTotal: 0,
        paymentsPage: 1,
        paymentsPageSize: 10,
        paymentsLoading: false,
        actionLoading: false,
        mutating: false,
      }),
      patchState: (val: any) => {
        patched = val;
      },
      dispatch: vi.fn(),
    };

    await (state.loadClaims(ctx as any) as any).toPromise();

    expect(mockApi.getAll).toHaveBeenCalled();
    expect(patched).toEqual({
      items: [mockClaimSummary],
      total: 1,
      totalsByCurrency: mockTotals,
      loading: false,
      error: null,
    });
  });

  it('should handle SubmitClaimReview action', async () => {
    const updatedClaim: ClaimDetail = {
      ...mockClaimDetail,
      status: 'RESERVED_NOT_SETTLED',
      review: {
        id: 'rev-1',
        decision: 'APPROVED',
        reason: 'Valid incident',
        reviewedAt: '2026-09-05T12:00:00.000Z',
        reviewedBy: 'adjuster',
      },
    };

    const mockApi = {
      getAll: vi.fn(),
      getById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      createReview: vi.fn().mockReturnValue(of(updatedClaim)),
      setApprovedPayout: vi.fn(),
      clearApprovedPayout: vi.fn(),
    };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: ClaimsApiService, useValue: mockApi },
        { provide: ClaimPaymentsApiService, useValue: {} },
        { provide: PoliciesApiService, useValue: {} },
        { provide: ExchangeRatesApiService, useValue: {} },
      ],
    });

    const state = TestBed.runInInjectionContext(() => new ClaimsState());

    const patches: any[] = [];
    const ctx = {
      getState: vi.fn(),
      patchState: (val: any) => patches.push(val),
      dispatch: vi.fn(),
    };

    await (
      state.submitClaimReview(
        ctx as any,
        new SubmitClaimReview('clm-1', {
          expectedVersion: 1,
          decision: 'APPROVED',
          reason: 'Valid incident',
        }),
      ) as any
    ).toPromise();

    expect(mockApi.createReview).toHaveBeenCalledWith('clm-1', {
      expectedVersion: 1,
      decision: 'APPROVED',
      reason: 'Valid incident',
    });
    expect(patches).toContainEqual({ actionLoading: true, error: null });
    expect(patches).toContainEqual({ selectedClaim: updatedClaim, actionLoading: false });
  });
});
