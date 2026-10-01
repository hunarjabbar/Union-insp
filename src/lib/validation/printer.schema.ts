// FILE: src/lib/validation/printer.schema.ts
// STAGE: 6
// UPDATED: 2026-10-01
import { z } from 'zod';

export const zPrinterCreate = z.object({
  stationId: z.string(),
  laneId: z.string().optional(),
  name: z.string().min(1).max(100),
  connectionType: z.enum(['WEBUSB','WEBSERIAL','NETWORK_TCP','BLUETOOTH'])
    .default('WEBUSB'),
  vendorId: z.string().optional(),
  productId: z.string().optional(),
  serialNumber: z.string().optional(),
  networkHost: z.string().optional(),
  networkPort: z.number().int().optional(),
  paperWidthMm: z.union([z.literal(58), z.literal(80)]).default(80),
  isDefault: z.boolean().default(false),
});

export const zPrinterUpdate = zPrinterCreate.partial().extend({ id: z.string() });

export const zPrinterStatusReport = z.object({
  id: z.string(),
  status: z.enum(['ONLINE','OFFLINE','PAPER_OUT','ERROR','UNPAIRED']),
  error: z.string().optional(),
});
