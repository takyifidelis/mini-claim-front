import { describe, expect, it } from 'vitest';
import { FormControl, FormGroup } from '@angular/forms';
import {
  buildExchangeRateEntriesFromBaseGhs,
  dateBeforeOrEqualValidator,
  dateNotInFutureValidator,
  moneyValidator,
  normalizeMoneyString,
  normalizeRateString,
  rateValidator,
} from './decimal.validator';

describe('Decimal and Money Validators', () => {
  describe('moneyValidator', () => {
    const validator = moneyValidator({ allowZero: true });
    const strictlyPositiveValidator = moneyValidator({ allowZero: false });

    it('should accept valid monetary strings', () => {
      const validCases = ['0', '0.00', '1', '12', '100.50', '999999999999999.99', '15000.00'];
      for (const val of validCases) {
        const control = new FormControl(val);
        expect(validator(control)).toBeNull();
      }
    });

    it('should reject invalid monetary formats', () => {
      const invalidCases = [
        '.5', // Missing integer digit
        '1.', // Missing fractional digit after dot
        '+100', // Signs
        '-50.00', // Negative sign
        '1,000.00', // Grouping separators
        '100,50', // Comma as decimal separator
        '007.50', // Invalid leading zeros
        '1e5', // Scientific notation
        'abc', // Non-numeric
        '100.123', // More than 2 decimal places
        '1234567890123456.00', // Exceeds 15 integer digits
      ];
      for (const val of invalidCases) {
        const control = new FormControl(val);
        expect(validator(control)).not.toBeNull();
      }
    });

    it('should reject zero when allowZero is false', () => {
      const control = new FormControl('0.00');
      expect(strictlyPositiveValidator(control)).toEqual({
        moneyPositive: 'Amount must be strictly greater than 0.00.',
      });
    });

    it('should accept positive amount when allowZero is false', () => {
      const control = new FormControl('100.00');
      expect(strictlyPositiveValidator(control)).toBeNull();
    });
  });

  describe('rateValidator', () => {
    const validator = rateValidator();

    it('should accept valid exchange rate strings up to 4 decimals (Bank of Ghana standard)', () => {
      const validCases = [
        '1',
        '1.0000',
        '15.5',
        '0.0645',
        '0.0595',
        '0.0001',
        '123456789012345.1234',
      ];
      for (const val of validCases) {
        const control = new FormControl(val);
        expect(validator(control)).toBeNull();
      }
    });

    it('should reject invalid exchange rate formats', () => {
      const invalidCases = [
        '.5',
        '1.',
        '+1.5',
        '-1.5',
        '1,500',
        '00.50',
        '1.12345', // More than 4 decimal places
        '1234567890123456.1234', // More than 15 integer digits
        '0', // Zero rate not allowed
      ];
      for (const val of invalidCases) {
        const control = new FormControl(val);
        expect(validator(control)).not.toBeNull();
      }
    });
  });

  describe('normalizeMoneyString', () => {
    it('should normalize money string to 2 decimal places', () => {
      expect(normalizeMoneyString('100')).toBe('100.00');
      expect(normalizeMoneyString('50.5')).toBe('50.50');
      expect(normalizeMoneyString('0')).toBe('0.00');
      expect(normalizeMoneyString('12345.67')).toBe('12345.67');
      expect(normalizeMoneyString(null)).toBe('0.00');
      expect(normalizeMoneyString('')).toBe('0.00');
    });
  });

  describe('normalizeRateString', () => {
    it('should normalize rate string to 4 decimal places', () => {
      expect(normalizeRateString('15.5')).toBe('15.5000');
      expect(normalizeRateString('1')).toBe('1.0000');
      expect(normalizeRateString('0.0645')).toBe('0.0645');
      expect(normalizeRateString('0.06451613')).toBe('0.0645');
    });
  });

  describe('buildExchangeRateEntriesFromBaseGhs', () => {
    it('should build all 6 bidirectional exchange rate entries from GHS base rates with 4 decimals', () => {
      const entries = buildExchangeRateEntriesFromBaseGhs('0.0645', '0.0595');
      expect(entries).toHaveLength(6);

      const ghsUsd = entries.find((e) => e.fromCurrency === 'GHS' && e.toCurrency === 'USD');
      const usdGhs = entries.find((e) => e.fromCurrency === 'USD' && e.toCurrency === 'GHS');
      const ghsEur = entries.find((e) => e.fromCurrency === 'GHS' && e.toCurrency === 'EUR');
      const eurGhs = entries.find((e) => e.fromCurrency === 'EUR' && e.toCurrency === 'GHS');
      const usdEur = entries.find((e) => e.fromCurrency === 'USD' && e.toCurrency === 'EUR');
      const eurUsd = entries.find((e) => e.fromCurrency === 'EUR' && e.toCurrency === 'USD');

      expect(ghsUsd?.rate).toBe('0.0645');
      expect(usdGhs?.rate).toBe('15.5039');
      expect(ghsEur?.rate).toBe('0.0595');
      expect(eurGhs?.rate).toBe('16.8067');
      expect(usdEur?.rate).toBe('0.9225');
      expect(eurUsd?.rate).toBe('1.0840');
    });

    it('should return empty array for invalid inputs', () => {
      expect(buildExchangeRateEntriesFromBaseGhs(0, '0.05')).toEqual([]);
      expect(buildExchangeRateEntriesFromBaseGhs('abc', '0.05')).toEqual([]);
    });
  });

  describe('dateNotInFutureValidator', () => {
    const validator = dateNotInFutureValidator();

    it('should allow today and past dates', () => {
      const today = new Date().toISOString().slice(0, 10);
      const past = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

      expect(validator(new FormControl(today))).toBeNull();
      expect(validator(new FormControl(past))).toBeNull();
    });

    it('should reject future dates', () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      expect(validator(new FormControl(tomorrow))).toEqual({ dateNotInFuture: true });
    });

    it('should reject future Date objects emitted by a date picker', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      expect(validator(new FormControl(tomorrow))).toEqual({ dateNotInFuture: true });
    });

    it('should allow today as a Date object', () => {
      expect(validator(new FormControl(new Date()))).toBeNull();
    });
  });

  describe('dateBeforeOrEqualValidator', () => {
    const validator = dateBeforeOrEqualValidator('startDate', 'endDate');

    it('should pass when startDate <= endDate', () => {
      const group = new FormGroup({
        startDate: new FormControl('2026-01-01'),
        endDate: new FormControl('2026-12-31'),
      });
      expect(validator(group)).toBeNull();

      const sameDateGroup = new FormGroup({
        startDate: new FormControl('2026-05-15'),
        endDate: new FormControl('2026-05-15'),
      });
      expect(validator(sameDateGroup)).toBeNull();
    });

    it('should fail when startDate > endDate', () => {
      const group = new FormGroup({
        startDate: new FormControl('2026-06-01'),
        endDate: new FormControl('2026-05-01'),
      });
      expect(validator(group)).toEqual({ dateRangeInvalid: true });
    });
  });
});
