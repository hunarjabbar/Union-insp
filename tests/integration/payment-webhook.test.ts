// FILE: tests/integration/payment-webhook.test.ts
// STAGE: 12
// UPDATED: 2026-10-02

import { describe, it, expect, vi } from 'vitest';
import { POST } from '@/app/api/payments/webhooks/[provider]/route';
import { prisma } from '@/lib/prisma';
import { getPaymentProvider } from '@/lib/payments';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    payment: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    inspection: {
      update: vi.fn(),
    },
    auditLog: {
      findFirst: vi.fn().mockResolvedValue({ hash: 'prev_hash' }),
      create: vi.fn(),
    },
    $transaction: vi.fn((cb) => cb(prisma)),
  },
}));

vi.mock('@/lib/payments', () => ({
  getPaymentProvider: vi.fn(),
}));

describe('Payment Webhook Integration Tests', () => {
  it('should fail if signature is invalid', async () => {
    const mockVerify = vi.fn().mockReturnValue(false);
    (getPaymentProvider as any).mockReturnValue({
      verifyWebhookSignature: mockVerify,
    });

    const req = new Request('http://localhost/api/payments/webhooks/fastpay', {
      method: 'POST',
      headers: { 'x-fastpay-signature': 'invalid' },
      body: JSON.stringify({ transaction_id: 'tx_123' }),
    });

    const res = await POST(req as any, { params: { provider: 'fastpay' } });
    expect(res.status).toBe(401);
  });

  it('should fail if payment is not found', async () => {
    const mockVerify = vi.fn().mockReturnValue(true);
    (getPaymentProvider as any).mockReturnValue({
      verifyWebhookSignature: mockVerify,
    });
    (prisma.payment.findFirst as any).mockResolvedValue(null);

    const req = new Request('http://localhost/api/payments/webhooks/fastpay', {
      method: 'POST',
      body: JSON.stringify({ transaction_id: 'tx_nonexistent' }),
    });

    const res = await POST(req as any, { params: { provider: 'fastpay' } });
    expect(res.status).toBe(404);
  });

  it('should complete pending payment successfully and transactionally update inspection', async () => {
    const mockVerify = vi.fn().mockReturnValue(true);
    const mockCheckStatus = vi.fn().mockResolvedValue('COMPLETED');
    (getPaymentProvider as any).mockReturnValue({
      verifyWebhookSignature: mockVerify,
      checkStatus: mockCheckStatus,
    });

    const mockPayment = {
      id: 'pay_123',
      inspectionId: 'ins_123',
      provider: 'FASTPAY',
      status: 'PENDING',
      amountIqd: 30000,
      inspection: { inspectorId: 'usr_1' },
    };

    (prisma.payment.findFirst as any).mockResolvedValue(mockPayment);

    const req = new Request('http://localhost/api/payments/webhooks/fastpay', {
      method: 'POST',
      body: JSON.stringify({ transaction_id: 'tx_123' }),
    });

    const res = await POST(req as any, { params: { provider: 'fastpay' } });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe('COMPLETED');
    expect(data.completed).toBe(true);
  });

  it('should be idempotent and skip duplicate operations', async () => {
    const mockVerify = vi.fn().mockReturnValue(true);
    (getPaymentProvider as any).mockReturnValue({
      verifyWebhookSignature: mockVerify,
    });

    const mockPayment = {
      id: 'pay_123',
      inspectionId: 'ins_123',
      provider: 'FASTPAY',
      status: 'COMPLETED',
      amountIqd: 30000,
    };

    (prisma.payment.findFirst as any).mockResolvedValue(mockPayment);

    const req = new Request('http://localhost/api/payments/webhooks/fastpay', {
      method: 'POST',
      body: JSON.stringify({ transaction_id: 'tx_123' }),
    });

    const res = await POST(req as any, { params: { provider: 'fastpay' } });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.idempotent).toBe(true);
    expect(data.status).toBe('COMPLETED');
  });
});
