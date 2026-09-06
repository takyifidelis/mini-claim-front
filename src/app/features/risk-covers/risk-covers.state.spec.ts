import { describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { RiskCoversState, LoadRiskCovers, CreateRiskCover } from './risk-covers.state';
import { RiskCover } from '../../shared/models';
import { RiskCoversApiService } from '../../core/api/risk-covers-api.service';

describe('RiskCoversState', () => {
  const mockCovers: RiskCover[] = [
    {
      id: 'rc-1',
      code: 'ACC_DAMAGE',
      name: 'Accidental Damage',
      description: 'Physical damage cover',
      status: 'ACTIVE',
      createdAt: '2026-09-05T00:00:00.000Z',
      createdBy: 'demo_user',
    },
  ];

  it('should handle LoadRiskCovers action', async () => {
    const mockApi = {
      getAll: vi.fn().mockReturnValue(of({
        items: mockCovers,
        totalItems: 1,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      })),
      getById: vi.fn(),
      create: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: RiskCoversApiService, useValue: mockApi }],
    });

    const state = TestBed.runInInjectionContext(() => new RiskCoversState());

    let patchCalledWith: any = null;
    const ctx = {
      getState: () => ({
        items: [],
        total: 0,
        page: 1,
        pageSize: 10,
        sortField: 'createdAt',
        sortDirection: 'desc' as const,
        filters: { status: null, search: '' },
        loading: false,
        error: null,
        selected: null,
        mutating: false,
      }),
      patchState: (val: any) => {
        patchCalledWith = val;
      },
      dispatch: vi.fn(),
    };

    await (state.loadRiskCovers(ctx as any) as any).toPromise();

    expect(mockApi.getAll).toHaveBeenCalled();
    expect(patchCalledWith).toEqual({
      items: mockCovers,
      total: 1,
      loading: false,
      error: null,
    });
  });

  it('should handle CreateRiskCover action', async () => {
    const newCover = {
      code: 'FIRE',
      name: 'Fire Damage',
      description: 'Fire perils',
      status: 'ACTIVE' as const,
    };

    const createdCover: RiskCover = {
      id: 'rc-2',
      ...newCover,
      createdAt: '2026-09-05T00:00:00.000Z',
      createdBy: 'demo_user',
    };

    const mockApi = {
      getAll: vi.fn(),
      getById: vi.fn(),
      create: vi.fn().mockReturnValue(of(createdCover)),
    };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [{ provide: RiskCoversApiService, useValue: mockApi }],
    });

    const state = TestBed.runInInjectionContext(() => new RiskCoversState());

    const patches: any[] = [];
    const ctx = {
      getState: vi.fn(),
      patchState: (val: any) => patches.push(val),
      dispatch: vi.fn(),
    };

    await (state.createRiskCover(ctx as any, new CreateRiskCover(newCover)) as any).toPromise();

    expect(mockApi.create).toHaveBeenCalledWith(newCover);
    expect(patches).toContainEqual({ mutating: true, error: null });
    expect(patches).toContainEqual({ selected: createdCover, mutating: false });
    expect(ctx.dispatch).toHaveBeenCalled();
  });
});
