import { describe, expect, it } from 'vitest';
import { buildQueryParams } from './query-params.builder';

describe('buildQueryParams', () => {
  it('should return empty HttpParams when undefined or null', () => {
    const p1 = buildQueryParams();
    expect(p1.keys()).toHaveLength(0);

    const p2 = buildQueryParams(undefined);
    expect(p2.keys()).toHaveLength(0);
  });

  it('should set trimmed string values, numbers, and booleans', () => {
    const params = buildQueryParams({
      search: '  CLM-2026-001  ',
      page: 2,
      pageSize: 10,
      active: true,
      emptyString: '',
      nullValue: null,
      undefinedValue: undefined,
    });

    expect(params.get('search')).toBe('CLM-2026-001');
    expect(params.get('page')).toBe('2');
    expect(params.get('pageSize')).toBe('10');
    expect(params.get('active')).toBe('true');
    expect(params.has('emptyString')).toBe(false);
    expect(params.has('nullValue')).toBe(false);
    expect(params.has('undefinedValue')).toBe(false);
  });
});
