// FILE: tests/unit/print/encoder-qr.test.ts
// STAGE: 13
// UPDATED: 2026-10-02

import { describe, it, expect } from 'vitest';
import { buildInspectionReceipt } from '@/lib/print/encoder';

describe('buildInspectionReceipt — QR embedding', () => {
  it('produces a non-empty Uint8Array', () => {
    const bytes = buildInspectionReceipt({
      receiptNumber: 'RCP-TEST-000001',
      inspectionCode: 'UI-TEST-000001',
      plateNumber: 'TEST-0001',
      category: 'HEAVY_FREIGHT',
      stationName: 'Test Station',
      laneName: 'Lane 1',
      result: 'PASS',
      defects: [],
      qrUrl: 'http://localhost:3000/verify/UI-TEST-000001',
      issuedAt: new Date(),
      widthMm: 80,
    });
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBeGreaterThan(50);
  });

  it('contains the ESC/POS QR command preamble', () => {
    const bytes = buildInspectionReceipt({
      receiptNumber: 'RCP-TEST-000002',
      inspectionCode: 'UI-TEST-000002',
      plateNumber: 'TEST-0002',
      category: 'HEAVY_FREIGHT',
      stationName: 'Test Station',
      laneName: 'Lane 1',
      result: 'PASS',
      defects: [],
      qrUrl: 'http://x/verify/y',
      issuedAt: new Date(),
      widthMm: 80,
    });
    // ESC/POS QR: GS ( k  pL pH cn fn  →  0x1D 0x28 0x6B ...
    const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0'));
    const joined = hex.join('');
    expect(joined).toContain('1d286b');
  });

  it('uses narrower column count for 58mm', () => {
    const bytes80 = buildInspectionReceipt({
      receiptNumber: 'R',
      inspectionCode: 'C',
      plateNumber: 'P',
      category: 'HEAVY_FREIGHT',
      stationName: 'S',
      laneName: 'L',
      result: 'PASS',
      defects: [],
      qrUrl: 'http://x/y',
      issuedAt: new Date(),
      widthMm: 80,
    });
    const bytes58 = buildInspectionReceipt({
      receiptNumber: 'R',
      inspectionCode: 'C',
      plateNumber: 'P',
      category: 'HEAVY_FREIGHT',
      stationName: 'S',
      laneName: 'L',
      result: 'PASS',
      defects: [],
      qrUrl: 'http://x/y',
      issuedAt: new Date(),
      widthMm: 58,
    });
    // The byte streams should differ in length or content due to
    // different column wrapping.
    expect(bytes80.length).not.toBe(bytes58.length);
  });
});
