// FILE: src/lib/validation/receipt.schema.ts
// STAGE: 6
// UPDATED: 2026-10-01
import { z } from 'zod';

export const zReceiptCreate = z.object({
  inspectionId: z.string(),
  paymentId: z.string().optional(),
});

export const zReceiptReprint = z.object({
  receiptId: z.string(),
  printerConfigId: z.string(),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
});
