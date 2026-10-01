// FILE: src/lib/validation/equipment.schema.ts
// STAGE: 6
// UPDATED: 2026-10-01
import { z } from 'zod';

export const zEquipmentCreate = z.object({
  stationId: z.string(),
  laneId: z.string().optional(),
  type: z.enum(['TIRE_SCANNER_3D','BRAKE_ROLLER_TESTER','LIGHT_BEAM_ALIGNER',
                'LUX_METER','PRESSURE_SENSOR','QR_PRINTER','LANE_CONTROLLER']),
  serialNumber: z.string().min(1).max(64),
  name: z.string().min(1).max(100),
  calibrationDue: z.string(),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  notes: z.string().optional(),
});

export const zEquipmentUpdate = zEquipmentCreate.partial().extend({ id: z.string() });

export const zCalibrationCreate = z.object({
  equipmentId: z.string(),
  calibrationDate: z.string(),
  nextDueDate: z.string(),
  certificateNo: z.string().optional(),
  certificateUrl: z.string().url().optional(),
  result: z.enum(['PASS','FAIL','ADJUSTED']),
  notes: z.string().optional(),
});
