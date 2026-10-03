// FILE: tests/unit/format.test.ts
// STAGE: 14
// UPDATED: 2026-10-03

import { describe, it, expect } from 'vitest';
import {
  formatIQD,
  formatDate,
  formatDateTime,
  generateInspectionCode,
  generateReceiptNumber,
  generateNcrNumber,
} from '@/lib/utils';

describe('Format and Generator Utilities', () => {
  describe('formatIQD', () => {
    it('formats numbers as Iraqi Dinar currency strings', () => {
      const formatted = formatIQD(35000);
      expect(formatted).toMatch(/35,000/);
      expect(formatted).toMatch(/IQD/);
    });

    it('formats zero correctly', () => {
      const formatted = formatIQD(0);
      expect(formatted).toMatch(/0/);
    });
  });

  describe('formatDate', () => {
    it('formats Date instances and ISO strings into YYYY-MM-DD', () => {
      const date = new Date('2026-10-03T14:30:00Z');
      expect(formatDate(date)).toBe('2026-10-03');
      expect(formatDate('2026-10-03T00:00:00Z')).toBe('2026-10-03');
    });
  });

  describe('formatDateTime', () => {
    it('formats dates into YYYY-MM-DD HH:mm', () => {
      const date = new Date(2026, 9, 3, 14, 30);
      expect(formatDateTime(date)).toBe('2026-10-03 14:30');
    });
  });

  describe('generateInspectionCode', () => {
    it('generates unique inspection code conforming to UI-YYYY-XXXXXX', () => {
      const code1 = generateInspectionCode();
      const code2 = generateInspectionCode();
      const currentYear = new Date().getFullYear();

      expect(code1).toMatch(new RegExp(`^UI-${currentYear}-\\d{6}$`));
      expect(code2).toMatch(new RegExp(`^UI-${currentYear}-\\d{6}$`));
      expect(code1).not.toBe(code2);
    });
  });

  describe('generateReceiptNumber', () => {
    it('generates unique receipt number conforming to RCP-YYYY-XXXXXX', () => {
      const receipt1 = generateReceiptNumber();
      const receipt2 = generateReceiptNumber();
      const currentYear = new Date().getFullYear();

      expect(receipt1).toMatch(new RegExp(`^RCP-${currentYear}-\\d{6}$`));
      expect(receipt2).toMatch(new RegExp(`^RCP-${currentYear}-\\d{6}$`));
      expect(receipt1).not.toBe(receipt2);
    });
  });

  describe('generateNcrNumber', () => {
    it('generates unique NCR number conforming to NCR-YYYY-XXXX', () => {
      const ncr1 = generateNcrNumber();
      const ncr2 = generateNcrNumber();
      const currentYear = new Date().getFullYear();

      expect(ncr1).toMatch(new RegExp(`^NCR-${currentYear}-\\d{4}$`));
      expect(ncr2).toMatch(new RegExp(`^NCR-${currentYear}-\\d{4}$`));
      expect(ncr1).not.toBe(ncr2);
    });
  });
});
