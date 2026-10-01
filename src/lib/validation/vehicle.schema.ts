// FILE: src/lib/validation/vehicle.schema.ts
// STAGE: 6
// UPDATED: 2026-10-01
import { z } from 'zod';

export const zVehicleCreate = z.object({
  plateNumber: z.string().min(1).max(20),
  vin: z.string().length(17).optional().or(z.literal('')),
  category: z.enum(['HEAVY_FREIGHT', 'TOUR_BUS', 'LIGHT_COMMERCIAL']),
  make: z.string().optional(),
  model: z.string().optional(),
  year: z.number().int().min(1950).max(2100).optional(),
  grossWeightKg: z.number().int().positive().optional(),
  fleetOwnerId: z.string().optional(),
  stationId: z.string().optional(),
});

export const zVehicleUpdate = zVehicleCreate.partial().extend({ id: z.string() });
