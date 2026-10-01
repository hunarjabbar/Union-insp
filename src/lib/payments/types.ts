// FILE: src/lib/payments/types.ts
// STAGE: 3
// UPDATED: 2026-10-01
import { PaymentProvider, PaymentStatus } from '@prisma/client';

export interface PaymentProviderAdapter {
  readonly provider: PaymentProvider;
  initiate(params: {
    amountIqd: number;
    inspectionCode: string;
    idempotencyKey: string;
    customerPhone?: string;
  }): Promise<{
    gatewayRef: string;
    qrData?: string;
    deepLink?: string;
    expiresAt: Date;
  }>;
  checkStatus(gatewayRef: string): Promise<PaymentStatus>;
  refund(gatewayRef: string, amountIqd: number): Promise<boolean>;
  verifyWebhookSignature(
    rawBody: string,
    headers: Record<string, string>
  ): boolean;
}
