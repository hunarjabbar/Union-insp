// FILE: src/lib/payments/fib.ts
// STAGE: 3
// UPDATED: 2026-10-01
import { PaymentProvider, PaymentStatus } from '@prisma/client';
import { PaymentProviderAdapter } from './types';
import crypto from 'crypto';

export class FIBAdapter implements PaymentProviderAdapter {
  readonly provider: PaymentProvider = 'FIB';

  private baseUrl: string;
  private clientId: string;
  private clientSecret: string;
  private callbackUrl: string;

  constructor() {
    this.baseUrl = process.env.FIB_BASE_URL || 'https://fib.stage.fib.iq';
    this.clientId = process.env.FIB_CLIENT_ID || 'MOCK_FIB_CLIENT_ID';
    this.clientSecret = process.env.FIB_CLIENT_SECRET || 'MOCK_FIB_CLIENT_SECRET';
    this.callbackUrl = process.env.FIB_CALLBACK_URL || 'http://localhost:3000/api/payments/webhooks/fib';
  }

  private async getAuthToken(): Promise<string> {
    if (!process.env.FIB_CLIENT_SECRET || process.env.NODE_ENV === 'development') return 'mock-fib-jwt';
    const res = await fetch(`${this.baseUrl}/auth/realms/fib-online-shop/protocol/openid-connect/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret,
      }).toString(),
    });
    const data = (await res.json()) as { access_token?: string };
    return data.access_token || '';
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
    const { amountIqd, idempotencyKey } = params;

    if (!process.env.FIB_CLIENT_SECRET || process.env.NODE_ENV === 'development') {
      const mockRef = `FIB-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
      const qrData = `fib://checkout?paymentId=${mockRef}&amount=${amountIqd}`;
      const deepLink = `https://fib.iq/pay/${mockRef}`;
      return { gatewayRef: mockRef, qrData, deepLink, expiresAt };
    }

    try {
      const token = await this.getAuthToken();
      const res = await fetch(`${this.baseUrl}/protected/v1/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          monetaryValue: { amount: amountIqd, currency: 'IQD' },
          statusCallbackUrl: this.callbackUrl,
          description: `Inspection Fee - ${idempotencyKey}`,
          refundableFor: 'P7D',
        }),
      });

      const data = (await res.json()) as {
        paymentId?: string;
        qrCode?: string;
        readableCode?: string;
        personalAppLink?: string;
        validUntil?: string;
      };

      const gatewayRef = data.paymentId || `FIB-${Date.now()}`;
      return {
        gatewayRef,
        qrData: data.qrCode || `fib://pay?paymentId=${gatewayRef}`,
        deepLink: data.personalAppLink || `https://fib.iq/pay/${gatewayRef}`,
        expiresAt: data.validUntil ? new Date(data.validUntil) : new Date(Date.now() + 15 * 60 * 1000),
      };
    } catch {
      const mockRef = `FIB-${Date.now()}`;
      return {
        gatewayRef: mockRef,
        qrData: `fib://pay?id=${idempotencyKey}&amount=${amountIqd}`,
        deepLink: `https://fib.iq/pay/${mockRef}`,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      };
    }
  }

  async checkStatus(gatewayRef: string): Promise<PaymentStatus> {
    if (!process.env.FIB_CLIENT_SECRET || process.env.NODE_ENV === 'development') return 'COMPLETED';
    try {
      const token = await this.getAuthToken();
      const res = await fetch(`${this.baseUrl}/protected/v1/payments/${gatewayRef}/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return 'FAILED';
      const data = (await res.json()) as { status?: string };
      if (data.status === 'PAID' || data.status === 'COMPLETED') return 'COMPLETED';
      if (data.status === 'UNPAID') return 'PENDING';
      return 'FAILED';
    } catch {
      return 'PROCESSING';
    }
  }

  async refund(gatewayRef: string, amountIqd: number): Promise<boolean> {
    try {
      const token = await this.getAuthToken();
      const res = await fetch(`${this.baseUrl}/protected/v1/payments/${gatewayRef}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ monetaryValue: { amount: amountIqd, currency: 'IQD' } }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  verifyWebhookSignature(rawBody: string, headers: Record<string, string>): boolean {
    const signature = headers['x-fib-signature'];
    if (!signature) return process.env.NODE_ENV === 'development';
    const expected = crypto.createHmac('sha256', this.clientSecret).update(rawBody).digest('hex');
    return signature === expected;
  }
}
