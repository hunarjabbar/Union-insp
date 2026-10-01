// FILE: src/actions/inspections.ts
// STAGE: 6
// UPDATED: 2026-10-01
'use server';

import { prisma } from '@/lib/prisma';
import { getAuthUser, requirePermission, requireRole } from '@/lib/rbac';
import { writeAudit } from '@/lib/audit';
import { signInspectionPayload } from '@/lib/qr';
import { isEnabled } from '@/lib/feature-flags';
import { generateInspectionCode } from '@/lib/utils';
import {
  evaluateTireInspection, evaluateBrakeInspection,
  evaluateLightInspection, evaluateOverall,
} from '@/lib/iso/pass-fail';
import {
  zInspectionCreate, zInspectionUpdate, zOverrideCreate,
} from '@/lib/validation/inspection.schema';
import type { ActionResult } from '@/types';
import type { Inspection } from '@prisma/client';

export async function createInspection(
  raw: unknown
): Promise<ActionResult<Inspection>> {
  const parsed = zInspectionCreate.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: 'Invalid input', fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const user = await getAuthUser();
  if (!user) return { ok: false, error: 'Unauthorized' };
  try { requirePermission(user, 'inspection', 'create'); }
  catch { return { ok: false, error: 'Forbidden' }; }

  const input = parsed.data;

  // ISO evaluation (pure)
  const tireEval = evaluateTireInspection(input.tire);
  const brakeEval = evaluateBrakeInspection(input.brake);
  const lightEval = evaluateLightInspection(input.light);
  const overall = evaluateOverall(tireEval, brakeEval, lightEval);

  const statusMap = {
    PASS: 'PASSED' as const,
    CONDITIONAL_PASS: 'CONDITIONAL_PASS' as const,
    FAIL: 'FAILED' as const,
  };

  const hasCritical = overall.defects.some(d => d.type === 'CRITICAL');
  const needsCountersign = overall.outcome === 'FAIL' && hasCritical
    && isEnabled('TWO_PERSON_INTEGRITY');

  const created = await prisma.$transaction(async (tx) => {
    // Upsert vehicle by plate
    const vehicle = await tx.vehicle.upsert({
      where: { vin: input.vin && input.vin.length === 17 ? input.vin : '__none__' },
      update: { plateNumber: input.plate, category: input.category },
      create: {
        plateNumber: input.plate,
        vin: input.vin && input.vin.length === 17 ? input.vin : null,
        category: input.category,
        plateCountry: 'Iraq-Kurdistan',
      },
    });

    // Create inspection
    const inspection = await tx.inspection.create({
      data: {
        inspectionCode: generateInspectionCode(),
        vehicleId: vehicle.id,
        stationId: input.stationId,
        laneId: input.laneId,
        inspectorId: user.userId,
        status: needsCountersign ? 'PENDING_COUNTERSIGN' : statusMap[overall.outcome],
        overallResult: overall.outcome,
        feeAmountIqd: 30000,
      },
    });

    // Test children
    await tx.tireInspection.create({
      data: {
        inspectionId: inspection.id, vehicleId: vehicle.id,
        treadDepthMm: input.tire.treadDepthMm,
        pressureKpa: input.tire.pressureKpa,
        sidewallCondition: input.tire.sidewallCondition,
        overallResult: tireEval.outcome,
      },
    });
    await tx.brakeInspection.create({
      data: {
        inspectionId: inspection.id, vehicleId: vehicle.id,
        axle1EfficiencyPct: input.brake.axle1EfficiencyPct,
        axle2EfficiencyPct: input.brake.axle2EfficiencyPct,
        axle3EfficiencyPct: input.brake.axle3EfficiencyPct,
        axle1ImbalancePct: input.brake.axle1ImbalancePct,
        axle2ImbalancePct: input.brake.axle2ImbalancePct,
        axle3ImbalancePct: input.brake.axle3ImbalancePct,
        overallResult: brakeEval.outcome,
      },
    });
    await tx.lightInspection.create({
      data: {
        inspectionId: inspection.id, vehicleId: vehicle.id,
        headlightAimLeft: input.light.headlightAimLeft,
        headlightAimRight: input.light.headlightAimRight,
        luxLeft: input.light.luxLeft, luxRight: input.light.luxRight,
        indicatorStatus: input.light.indicatorStatus,
        overallResult: lightEval.outcome,
      },
    });

    // Defects
    if (overall.defects.length) {
      await tx.defect.createMany({
        data: overall.defects.map(d => ({
          inspectionId: inspection.id,
          category: d.category, type: d.type, description: d.description,
          measuredValue: d.measuredValue, requiredValue: d.requiredValue,
          location: d.location,
        })),
      });
    }

    // QR unless countersign pending
    let qrCodeData: string | null = null;
    let qrSignature: string | null = null;
    let qrExpiresAt: Date | null = null;
    if (!needsCountersign) {
      const expires = new Date(Date.now() + 365 * 24 * 60 * 60_000);
      const { data, signature } = signInspectionPayload({
        inspectionCode: inspection.inspectionCode,
        vehiclePlate: input.plate,
        result: overall.outcome,
        expiresAt: expires.toISOString(),
        stationId: input.stationId,
      });
      qrCodeData = data; qrSignature = signature; qrExpiresAt = expires;
      await tx.inspection.update({
        where: { id: inspection.id },
        data: { qrCodeData, qrSignature, qrExpiresAt },
      });
    }

    await writeAudit({ tx, userId: user.userId, inspectionId: inspection.id,
      action: 'INSPECTION_CREATED', entityType: 'Inspection',
      entityId: inspection.id,
      newValues: { inspectionCode: inspection.inspectionCode,
                   outcome: overall.outcome, status: inspection.status } });

    return inspection;
  });

  return { ok: true, data: created };
}

export async function updateInspection(raw: unknown): Promise<ActionResult<Inspection>> {
  const parsed = zInspectionUpdate.safeParse(raw);
  if (!parsed.success) return { ok: false, error: 'Invalid input' };
  const user = await getAuthUser();
  if (!user) return { ok: false, error: 'Unauthorized' };
  try { requireRole(user, ['SUPER_ADMIN', 'LEAD_INSPECTOR']); }
  catch { return { ok: false, error: 'Forbidden' }; }

  const { id, ...updates } = parsed.data;
  const updated = await prisma.$transaction(async (tx) => {
    const before = await tx.inspection.findUnique({ where: { id } });
    if (!before) throw new Error('Not found');
    const after = await tx.inspection.update({ where: { id }, data: updates });
    await writeAudit({ tx, userId: user.userId, inspectionId: id,
      action: 'INSPECTION_UPDATED', entityType: 'Inspection', entityId: id,
      oldValues: before, newValues: after });
    return after;
  });
  return { ok: true, data: updated };
}

export async function overrideDefect(raw: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = zOverrideCreate.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: 'Invalid input',
      fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const user = await getAuthUser();
  if (!user) return { ok: false, error: 'Unauthorized' };
  try { requireRole(user, ['SUPER_ADMIN', 'LEAD_INSPECTOR']); }
  catch { return { ok: false, error: 'Forbidden' }; }

  const { inspectionId, parameter, machineValue, overrideValue, justification } = parsed.data;

  await prisma.$transaction(async (tx) => {
    const inspection = await tx.inspection.findUnique({ where: { id: inspectionId } });
    if (!inspection) throw new Error('Not found');
    await tx.override.create({
      data: { inspectionId, userId: user.userId,
              parameter, machineValue, overrideValue, justification },
    });
    await tx.inspection.update({
      where: { id: inspectionId },
      data: { amendedCount: { increment: 1 } },
    });
    await writeAudit({ tx, userId: user.userId, inspectionId,
      action: 'OVERRIDE_APPLIED', entityType: 'Inspection', entityId: inspectionId,
      newValues: { parameter, machineValue, overrideValue, justification } });
  });

  return { ok: true, data: { id: inspectionId } };
}

export async function countersignInspection(id: string): Promise<ActionResult<Inspection>> {
  const user = await getAuthUser();
  if (!user) return { ok: false, error: 'Unauthorized' };
  try { requireRole(user, ['LEAD_INSPECTOR']); }
  catch { return { ok: false, error: 'Forbidden' }; }

  const updated = await prisma.$transaction(async (tx) => {
    const inspection = await tx.inspection.findUnique({
      where: { id }, include: { vehicle: true },
    });
    if (!inspection) throw new Error('Not found');
    if (inspection.status !== 'PENDING_COUNTERSIGN')
      throw new Error('Not awaiting countersignature');

    const expires = new Date(Date.now() + 365 * 24 * 60 * 60_000);
    const { data, signature } = signInspectionPayload({
      inspectionCode: inspection.inspectionCode,
      vehiclePlate: inspection.vehicle.plateNumber,
      result: inspection.overallResult ?? 'FAIL',
      expiresAt: expires.toISOString(),
      stationId: inspection.stationId,
    });

    const after = await tx.inspection.update({
      where: { id },
      data: {
        countersignedById: user.userId, countersignedAt: new Date(),
        qrCodeData: data, qrSignature: signature, qrExpiresAt: expires,
        status: 'FAILED',
      },
    });
    await writeAudit({ tx, userId: user.userId, inspectionId: id,
      action: 'INSPECTION_COUNTERSIGNED', entityType: 'Inspection', entityId: id });
    return after;
  });

  return { ok: true, data: updated };
}

export async function listInspections(filter: {
  stationId?: string; status?: string; from?: string; to?: string;
  page?: number; pageSize?: number;
} = {}) {
  const user = await getAuthUser();
  if (!user) return { ok: false as const, error: 'Unauthorized' };
  const page = filter.page ?? 1;
  const pageSize = Math.min(filter.pageSize ?? 20, 100);
  const where: Record<string, unknown> = {};
  if (filter.stationId) where.stationId = filter.stationId;
  if (filter.status) where.status = filter.status;
  if (filter.from || filter.to) {
    where.createdAt = {};
    if (filter.from) (where.createdAt as Record<string, unknown>).gte = new Date(filter.from);
    if (filter.to) (where.createdAt as Record<string, unknown>).lte = new Date(filter.to);
  }
  const [rows, total] = await Promise.all([
    prisma.inspection.findMany({
      where, orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize, take: pageSize,
      include: { vehicle: true, station: true, inspector: true, payments: true },
    }),
    prisma.inspection.count({ where }),
  ]);
  return { ok: true as const, data: { rows, total, page, pageSize } };
}

export async function getInspectionById(id: string) {
  const user = await getAuthUser();
  if (!user) return { ok: false as const, error: 'Unauthorized' };
  const inspection = await prisma.inspection.findUnique({
    where: { id },
    include: {
      vehicle: true, station: true, lane: true, inspector: true,
      countersignedUser: true, tireChecks: true, brakeChecks: true,
      lightChecks: true, defects: true, overrides: true,
      payments: true, receipts: true,
    },
  });
  if (!inspection) return { ok: false as const, error: 'Not found' };
  return { ok: true as const, data: inspection };
}

export async function deleteInspection(id: string): Promise<ActionResult<null>> {
  const user = await getAuthUser();
  if (!user) return { ok: false, error: 'Unauthorized' };
  try { requireRole(user, ['SUPER_ADMIN']); }
  catch { return { ok: false, error: 'Forbidden' }; }
  await prisma.$transaction(async (tx) => {
    await tx.inspection.update({
      where: { id },
      data: { status: 'FAILED', overallResult: 'DELETED' },
    });
    await writeAudit({ tx, userId: user.userId, inspectionId: id,
      action: 'INSPECTION_DELETED', entityType: 'Inspection', entityId: id });
  });
  return { ok: true, data: null };
}
