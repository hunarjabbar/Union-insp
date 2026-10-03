// FILE: tests/unit/print/pdf.test.ts
// STAGE: 13
// UPDATED: 2026-10-02

import { describe, it, expect } from 'vitest';
import { renderReceiptPdf } from '@/lib/print/pdf';

describe('renderReceiptPdf', () => {
  it('returns a PDF buffer', async () => {
    const buffer = await renderReceiptPdf({
      receiptNumber: 'RCP-TEST-000001',
      inspectionCode: 'UI-TEST-000001',
      plateNumber: 'TEST-0001',
      category: 'HEAVY_FREIGHT',
      stationName: 'Test Station',
      laneName: 'Lane 1',
      result: 'PASS',
      defects: [{ type: 'MINOR', description: 'Sample' }],
      qrUrl: 'http://localhost:3000/verify/UI-TEST-000001',
      paidAmountIqd: 30000,
      paymentMethod: 'CASH',
      issuedAt: new Date(),
      widthMm: 80,
    });
    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.subarray(0, 5).toString()).toBe('%PDF-');
    expect(buffer.length).toBeGreaterThan(1000);
  });
});
