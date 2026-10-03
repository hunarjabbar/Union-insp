// FILE: tests/unit/qr.test.ts
// STAGE: 14
// UPDATED: 2026-10-03

import { describe, it, expect } from 'vitest';
import {
  signInspectionPayload,
  verifyInspectionPayload,
  type InspectionQrPayload,
} from '@/lib/qr';

describe('QR Code Signing and Verification', () => {
  const samplePayload: InspectionQrPayload = {
    inspectionCode: 'UI-2026-894123',
    vehiclePlate: 'IQ-ERB-98412',
    result: 'PASSED',
    expiresAt: '2027-10-03T00:00:00.000Z',
    stationId: 'stn_erbil_01',
  };

  it('performs complete round-trip sign and verify successfully', () => {
    const { data, signature } = signInspectionPayload(samplePayload);
    expect(typeof data).toBe('string');
    expect(typeof signature).toBe('string');
    expect(data.length).toBeGreaterThan(10);
    expect(signature.length).toBeGreaterThan(10);

    const verified = verifyInspectionPayload(data, signature);
    expect(verified).not.toBeNull();
    expect(verified?.inspectionCode).toBe(samplePayload.inspectionCode);
    expect(verified?.vehiclePlate).toBe(samplePayload.vehiclePlate);
    expect(verified?.result).toBe('PASSED');
    expect(verified?.stationId).toBe('stn_erbil_01');
  });

  it('fails verification and returns null when payload data is tampered', () => {
    const { data, signature } = signInspectionPayload(samplePayload);

    // Tamper with the base64url data payload (e.g. modify characters)
    const tamperedData = data.substring(0, data.length - 4) + 'AAAA';

    const verified = verifyInspectionPayload(tamperedData, signature);
    expect(verified).toBeNull();
  });

  it('fails verification and returns null when digital signature is tampered', () => {
    const { data, signature } = signInspectionPayload(samplePayload);

    // Tamper with signature
    const tamperedSignature =
      signature[0] === 'A' ? 'B' + signature.slice(1) : 'A' + signature.slice(1);

    const verified = verifyInspectionPayload(data, tamperedSignature);
    expect(verified).toBeNull();
  });
});
