// FILE: src/lib/payments/mock.ts
// STAGE: 3
// UPDATED: 2026-10-01
import { PaymentProvider, PaymentStatus } from '@prisma/client';
import { PaymentProviderAdapter } from './types';

export class MockPaymentAdapter implements PaymentProviderAdapter {
  readonly provider: PaymentProvider;

  constructor(provider: PaymentProvider = 'CASH') {
    this.provider = provider;
  }

  async initiate(params: {
    amountIqd: number;
    inspectionCode: string;
    idempotencyKey: string;
    customerPhone?: string;
  }): Promise<{
    gatewayRef: string;
    qrData?: string;
    deepLink?: string;
    expiresAt: Date;
  }> {
    const { idempotencyKey, amountIqd } = params;
    const gatewayRef = `MOCK-${this.provider}-${Date.now()}`;
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    return {
      gatewayRef,
      qrData: `mock://${this.provider.toLowerCase()}?ref=${gatewayRef}&order=${idempotencyKey}&amount=${amountIqd}`,
      deepLink: `http://localhost:3000/api/payments/mock/complete?ref=${gatewayRef}`,
      expiresAt,
    };
  }

  async checkStatus(gatewayRef: string): Promise<PaymentStatus> {
    void gatewayRef;
    return 'COMPLETED';
  }

  async refund(gatewayRef: string, amountIqd: number): Promise<boolean> {
    void gatewayRef;
    void amountIqd;
    return true;
  }

  verifyWebhookSignature(rawBody: string, headers: Record<string, string>): boolean {
    void rawBody;
    void headers;
    return true;
  }
}
