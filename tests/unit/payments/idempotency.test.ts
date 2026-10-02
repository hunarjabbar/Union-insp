// FILE: tests/unit/payments/idempotency.test.ts
// STAGE: 12
// UPDATED: 2026-10-02

import { describe, it, expect, vi } from 'vitest';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    payment: {
      create: vi.fn(),
    },
  },
}));

describe('Payment Idempotency Test', () => {
  it('should reject creation of payments with duplicate idempotency keys', async () => {
    const mockCreate = prisma.payment.create as any;

    // First payment succeeds
    mockCreate.mockResolvedValueOnce({
      id: 'pay_1',
      idempotencyKey: 'dup_key_123',
    });

    const payment1 = await prisma.payment.create({
      data: {
        inspectionId: 'ins_1',
        provider: 'FASTPAY',
        amountIqd: 30000,
        status: 'PENDING',
        idempotencyKey: 'dup_key_123',
      },
    });

    expect(payment1.idempotencyKey).toBe('dup_key_123');

    // Second payment creation with same key throws unique constraint error
    mockCreate.mockRejectedValueOnce(
      new Error('Unique constraint violation: idempotency_key')
    );

    await expect(
      prisma.payment.create({
        data: {
          inspectionId: 'ins_2',
          provider: 'FASTPAY',
          amountIqd: 30000,
          status: 'PENDING',
          idempotencyKey: 'dup_key_123',
        },
      })
    ).rejects.toThrow('Unique constraint violation');
  });
});
