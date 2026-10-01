// FILE: src/lib/payments/index.ts
// STAGE: 3
// UPDATED: 2026-10-01
import { PaymentProvider } from '@prisma/client';
import { PaymentProviderAdapter } from './types';
import { FastPayAdapter } from './fastpay';
import { ZainCashAdapter } from './zaincash';
import { FIBAdapter } from './fib';
import { MockPaymentAdapter } from './mock';

export * from './types';
export * from './fastpay';
export * from './zaincash';
export * from './fib';
export * from './mock';

const providers: Record<PaymentProvider, PaymentProviderAdapter> = {
  FASTPAY: new FastPayAdapter(),
  ZAINCASH: new ZainCashAdapter(),
  FIB: new FIBAdapter(),
  NASSPAY: new MockPaymentAdapter('NASSPAY'),
  QICARD: new MockPaymentAdapter('QICARD'),
  CASH: new MockPaymentAdapter('CASH'),
};

export function getPaymentProvider(name?: PaymentProvider): PaymentProviderAdapter {
  if (name && providers[name]) return providers[name];
  const envDefault = (process.env.PAYMENT_DEFAULT_PROVIDER || 'CASH').toUpperCase() as PaymentProvider;
  return providers[envDefault] || providers.CASH;
}
