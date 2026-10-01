// FILE: src/actions/equipment.ts
// STAGE: 6
// UPDATED: 2026-10-01
'use server';

import { prisma } from '@/lib/prisma';
import { getAuthUser, requirePermission } from '@/lib/rbac';
import { writeAudit } from '@/lib/audit';
import {
  zEquipmentCreate, zEquipmentUpdate, zCalibrationCreate,
} from '@/lib/validation/equipment.schema';
import type { ActionResult } from '@/types';
import type { Equipment, CalibrationLog } from '@prisma/client';

export async function createEquipment(raw: unknown): Promise<ActionResult<Equipment>> {
  const parsed = zEquipmentCreate.safeParse(raw);
  if (!parsed.success) return { ok: false, error: 'Invalid input' };
  const user = await getAuthUser();
  if (!user) return { ok: false, error: 'Unauthorized' };
  try { requirePermission(user, 'equipment', 'create'); }
  catch { return { ok: false, error: 'Forbidden' }; }

  const d = parsed.data;
  const e = await prisma.$transaction(async (tx) => {
    const created = await tx.equipment.create({
      data: {
        stationId: d.stationId,
        laneId: d.laneId,
        serialNumber: d.serialNumber,
        name: d.name,
        calibrationDue: new Date(d.calibrationDue),
      },
    });
    await writeAudit({ tx, userId: user.userId, action: 'EQUIPMENT_CREATED',
      entityType: 'Equipment', entityId: created.id, newValues: created });
    return created;
  });
  return { ok: true, data: e };
}

export async function updateEquipment(raw: unknown): Promise<ActionResult<Equipment>> {
  const parsed = zEquipmentUpdate.safeParse(raw);
  if (!parsed.success) return { ok: false, error: 'Invalid input' };
  const user = await getAuthUser();
  if (!user) return { ok: false, error: 'Unauthorized' };
  try { requirePermission(user, 'equipment', 'update'); }
  catch { return { ok: false, error: 'Forbidden' }; }
  const { id, calibrationDue, ...updates } = parsed.data;
  const e = await prisma.$transaction(async (tx) => {
    const before = await tx.equipment.findUnique({ where: { id } });
    if (!before) throw new Error('Not found');
    const after = await tx.equipment.update({
      where: { id },
      data: {
        ...updates,
        calibrationDue: calibrationDue ? new Date(calibrationDue) : undefined,
      },
    });
    await writeAudit({ tx, userId: user.userId, action: 'EQUIPMENT_UPDATED',
      entityType: 'Equipment', entityId: id, oldValues: before, newValues: after });
    return after;
  });
  return { ok: true, data: e };
}

export async function deleteEquipment(id: string): Promise<ActionResult<null>> {
  const user = await getAuthUser();
  if (!user) return { ok: false, error: 'Unauthorized' };
  try { requirePermission(user, 'equipment', 'delete'); }
  catch { return { ok: false, error: 'Forbidden' }; }
  await prisma.$transaction(async (tx) => {
    await tx.equipment.update({ where: { id }, data: { status: 'DECOMMISSIONED' } });
    await writeAudit({ tx, userId: user.userId, action: 'EQUIPMENT_DECOMMISSIONED',
      entityType: 'Equipment', entityId: id });
  });
  return { ok: true, data: null };
}

export async function listEquipment(filter: { stationId?: string } = {}) {
  const equipment = await prisma.equipment.findMany({
    where: filter.stationId ? { stationId: filter.stationId } : {},
    orderBy: [{ stationId: 'asc' }, { name: 'asc' }],
    include: { station: { select: { name: true } }, lane: { select: { name: true } },
      calibrationLogs: { orderBy: { calibratedAt: 'desc' }, take: 1 } },
  });
  return { ok: true as const, data: equipment };
}

export async function logCalibration(raw: unknown): Promise<ActionResult<CalibrationLog>> {
  const parsed = zCalibrationCreate.safeParse(raw);
  if (!parsed.success) return { ok: false, error: 'Invalid input' };
  const user = await getAuthUser();
  if (!user) return { ok: false, error: 'Unauthorized' };
  try { requirePermission(user, 'calibration', 'create'); }
  catch { return { ok: false, error: 'Forbidden' }; }

  const d = parsed.data;
  const calibrationDate = new Date(d.calibrationDate);
  const nextDueDate = new Date(d.nextDueDate);

  const log = await prisma.$transaction(async (tx) => {
    const created = await tx.calibrationLog.create({
      data: {
        equipmentId: d.equipmentId,
        calibratedBy: user.userId,
        calibratedAt: calibrationDate,
        certificateNo: d.certificateNo ?? 'CERT-PENDING',
        nextDue: nextDueDate,
      },
    });
    await tx.equipment.update({
      where: { id: d.equipmentId },
      data: {
        calibrationDue: nextDueDate,
        status: 'OPERATIONAL',
      },
    });
    await writeAudit({ tx, userId: user.userId, action: 'CALIBRATION_LOGGED',
      entityType: 'CalibrationLog', entityId: created.id, newValues: created });
    return created;
  });
  return { ok: true, data: log };
}
