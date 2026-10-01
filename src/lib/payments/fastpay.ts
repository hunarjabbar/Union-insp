// FILE: src/lib/payments/fastpay.ts
// STAGE: 3
// UPDATED: 2026-10-01
import { PaymentProvider, PaymentStatus } from '@prisma/client';
import { PaymentProviderAdapter } from './types';
import crypto from 'crypto';

export class FastPayAdapter implements PaymentProviderAdapter {
  readonly provider: PaymentProvider = 'FASTPAY';

  private baseUrl: string;
  private storeId: string;
  private storePassword: string;
  private refundSecretKey: string;

  constructor() {
    this.baseUrl = process.env.FASTPAY_BASE_URL || 'https://staging-apigw-merchant.fast-pay.iq';
    this.storeId = process.env.FASTPAY_STORE_ID || 'MOCK_FASTPAY_STORE';
    this.storePassword = process.env.FASTPAY_STORE_PASSWORD || 'MOCK_FASTPAY_PASS';
    this.refundSecretKey = process.env.FASTPAY_REFUND_SECRET_KEY || 'MOCK_REFUND_KEY';
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
    const { amountIqd, idempotencyKey, customerPhone } = params;

    if (!process.env.FASTPAY_STORE_ID || process.env.NODE_ENV === 'development') {
      const mockRef = `FP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
      const qrData = `fastpay://pay?store_id=${this.storeId}&order_id=${idempotencyKey}&amount=${amountIqd}&ref=${mockRef}`;
      const deepLink = `https://fastpay.iq/checkout?ref=${mockRef}`;
      return { gatewayRef: mockRef, qrData, deepLink, expiresAt };
    }

    try {
      const res = await fetch(`${this.baseUrl}/v1/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store_id: this.storeId,
          store_password: this.storePassword,
          order_id: idempotencyKey,
          bill_amount: amountIqd,
          currency: 'IQD',
          customer_mobile_number: customerPhone,
        }),
      });

      if (!res.ok) throw new Error(`FastPay error: ${res.statusText}`);

      const data = (await res.json()) as {
        transaction_id?: string;
        token?: string;
        redirect_url?: string;
        qr_code?: string;
      };

      const gatewayRef = data.transaction_id || data.token || idempotencyKey;
      return {
        gatewayRef,
        qrData: data.qr_code || `fastpay://pay?token=${gatewayRef}`,
        deepLink: data.redirect_url || `https://fastpay.iq/pay/${gatewayRef}`,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      };
    } catch {
      const mockRef = `FP-${Date.now()}`;
      return {
        gatewayRef: mockRef,
        qrData: `fastpay://pay?order_id=${idempotencyKey}&amount=${amountIqd}`,
        deepLink: `https://fastpay.iq/pay/${mockRef}`,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      };
    }
  }

  async checkStatus(gatewayRef: string): Promise<PaymentStatus> {
    if (!process.env.FASTPAY_STORE_ID || process.env.NODE_ENV === 'development') return 'COMPLETED';
    try {
      const res = await fetch(`${this.baseUrl}/v1/payment/validation/${gatewayRef}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'Store-Id': this.storeId },
      });
      if (!res.ok) return 'FAILED';
      const data = (await res.json()) as { status?: string };
      if (data.status === 'Success' || data.status === 'COMPLETED') return 'COMPLETED';
      if (data.status === 'Pending' || data.status === 'PROCESSING') return 'PROCESSING';
      return 'FAILED';
    } catch {
      return 'PROCESSING';
    }
  }

  async refund(gatewayRef: string, amountIqd: number): Promise<boolean> {
    if (!process.env.FASTPAY_STORE_ID || process.env.NODE_ENV === 'development') return true;
    try {
      const res = await fetch(`${this.baseUrl}/v1/payment/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store_id: this.storeId,
          store_password: this.storePassword,
          refund_key: this.refundSecretKey,
          transaction_id: gatewayRef,
          refund_amount: amountIqd,
        }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  verifyWebhookSignature(rawBody: string, headers: Record<string, string>): boolean {
    const signature = headers['x-fastpay-signature'];
    if (!signature) return process.env.NODE_ENV === 'development';
    const expected = crypto.createHmac('sha256', this.storePassword).update(rawBody).digest('hex');
    return signature === expected;
  }
}
