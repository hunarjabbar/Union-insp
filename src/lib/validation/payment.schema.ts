// FILE: src/lib/validation/payment.schema.ts
// STAGE: 6
// UPDATED: 2026-10-01
import { z } from 'zod';

export const zPaymentInitiate = z.object({
  inspectionId: z.string(),
  provider: z.enum(['FASTPAY','ZAINCASH','FIB','NASSPAY','QICARD','CASH']),
  customerPhone: z.string().optional(),
});

export const zCashPayment = z.object({
  inspectionId: z.string(),
  amountIqd: z.number().int().positive().default(30000),
});
