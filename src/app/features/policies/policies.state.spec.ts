import { describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { PoliciesState } from './policies.state';
import { PolicySummary } from '../../shared/models';
import { PoliciesApiService } from '../../core/api/policies-api.service';
import { RiskCoversApiService } from '../../core/api/risk-covers-api.service';

describe('PoliciesState', () => {
  const mockPolicySummary: PolicySummary = {
    id: 'pol-1',
    policyNumber: 'POL-2026-000001',
    insuredName: 'Acme Ltd',
    policyType: 'Commercial Property',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    currency: 'USD',
    premiumAmount: '2500.00',
    sumInsured: '100000.00',
    exchangeRateSheetId: 'fx-1',
    status: 'ACTIVE',
    createdAt: '2026-09-05T00:00:00.000Z',
    updatedAt: '2026-09-05T00:00:00.000Z',
    createdBy: 'demo_user',
  };

  it('should load list of policies', async () => {
    const mockApi = {
      getAll: vi.fn().mockReturnValue(of({
        items: [mockPolicySummary],
        totalItems: 1,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      })),
      getOptions: vi.fn(),
      getById: vi.fn(),
      create: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: PoliciesApiService, useValue: mockApi }],
    });

    const state = TestBed.runInInjectionContext(() => new PoliciesState());

    let patched: any = null;
    const ctx = {
      getState: () => ({
        items: [],
        total: 0,
        page: 1,
        pageSize: 10,
        sortField: 'createdAt',
        sortDirection: 'desc' as const,
        filters: { currency: null, status: null, search: '' },
        loading: false,
        error: null,
        selectedPolicy: null,
        selectablePolicies: [],
        selectableRiskCovers: [],
        mutating: false,
      }),
      patchState: (val: any) => {
        patched = val;
      },
      dispatch: vi.fn(),
    };

    await (state.loadPolicies(ctx as any) as any).toPromise();

    expect(mockApi.getAll).toHaveBeenCalled();
    expect(patched).toEqual({
      items: [mockPolicySummary],
      total: 1,
      loading: false,
      error: null,
    });
  });

  it('loads selector policies independently from list state', async () => {
    const mockApi = {
      getOptions: vi.fn().mockReturnValue(of([mockPolicySummary])),
    };
    const mockRiskCoversApi = {
      getOptions: vi.fn().mockReturnValue(of([])),
    };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: PoliciesApiService, useValue: mockApi },
        { provide: RiskCoversApiService, useValue: mockRiskCoversApi },
      ],
    });

    const state = TestBed.runInInjectionContext(() => new PoliciesState());
    const patchState = vi.fn();

    await (state.loadSelectablePolicies({ patchState } as never) as any).toPromise();

    expect(mockApi.getOptions).toHaveBeenCalledOnce();
    expect(patchState).toHaveBeenCalledWith({ selectablePolicies: [mockPolicySummary] });
  });
});
