// FILE: src/lib/validation/inspection.schema.ts
// STAGE: 6
// UPDATED: 2026-10-01
import { z } from 'zod';

export const zInspectionCreate = z.object({
  plate: z.string().min(1).max(20),
  vin: z.string().length(17).optional().or(z.literal('')),
  category: z.enum(['HEAVY_FREIGHT', 'TOUR_BUS', 'LIGHT_COMMERCIAL']),
  stationId: z.string(),
  laneId: z.string(),
  tire: z.object({
    treadDepthMm: z.array(z.number()).min(1),
    pressureKpa: z.array(z.number()).min(1),
    specPressureKpa: z.number().positive(),
    sidewallCondition: z.array(z.enum(['OK','MINOR_CUT','CORD_EXPOSED','BULGE'])),
  }),
  brake: z.object({
    axle1EfficiencyPct: z.number(),
    axle2EfficiencyPct: z.number(),
    axle3EfficiencyPct: z.number().optional(),
    axle1ImbalancePct: z.number(),
    axle2ImbalancePct: z.number(),
    axle3ImbalancePct: z.number().optional(),
  }),
  light: z.object({
    headlightAimLeft: z.enum(['OK','LOW','HIGH','OFF']),
    headlightAimRight: z.enum(['OK','LOW','HIGH','OFF']),
    luxLeft: z.number(),
    luxRight: z.number(),
    specLux: z.number().positive(),
    indicatorStatus: z.object({
      leftTurn: z.boolean(),
      rightTurn: z.boolean(),
      brake: z.boolean(),
      hazard: z.boolean(),
      reverse: z.boolean(),
    }),
  }),
});

export const zInspectionUpdate = z.object({
  id: z.string(),
  overallResult: z.string().optional(),
  status: z.enum(['SCHEDULED','IN_PROGRESS','PASSED','CONDITIONAL_PASS',
                  'FAILED','RE_INSPECTION_REQUIRED','PENDING_COUNTERSIGN']).optional(),
});

export const zOverrideCreate = z.object({
  inspectionId: z.string(),
  parameter: z.string().min(1),
  machineValue: z.string().min(1),
  overrideValue: z.string().min(1),
  justification: z.string().min(30, 'Justification must be at least 30 characters'),
});
