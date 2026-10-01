// FILE: src/types/index.ts
// STAGE: 3
// UPDATED: 2026-10-01
export type {
  User,
  Inspection,
  Vehicle,
  Station,
  Lane,
  Equipment,
  NCR,
  AuditLog,
  Payment,
  Receipt,
  PrinterConfig,
  Role,
  InspectionStatus,
  DefectType,
  PaymentProvider,
  PaymentStatus,
  PrinterStatus,
  DefectCategory,
} from '@prisma/client';

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };
