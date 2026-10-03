// FILE: tests/setup.ts
// STAGE: 14
// UPDATED: 2026-10-03

import { vi } from 'vitest';
import path from 'path';

process.env.JWT_SECRET = process.env.JWT_SECRET || '8b8d4cf56a73c1d94f2953288f6be4e37f694e4da20188efac37bdc51b9e2810';
process.env.PAYMENT_DEFAULT_PROVIDER = 'mock';
process.env.QR_SIGNING_KEY_PATH = path.resolve(process.cwd(), './keys/qr-private.pem');
process.env.QR_VERIFICATION_PUBLIC_KEY_PATH = path.resolve(process.cwd(), './keys/qr-public.pem');

vi.mock('@/lib/logger', () => {
  const noop = () => {};
  const mockLogger = {
    info: vi.fn(noop),
    warn: vi.fn(noop),
    error: vi.fn(noop),
    debug: vi.fn(noop),
    trace: vi.fn(noop),
    child: vi.fn(() => mockLogger),
  };
  return {
    logger: mockLogger,
    default: mockLogger,
  };
});
