// FILE: src/actions/lanes.ts
// STAGE: 6
// UPDATED: 2026-10-01
'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthUser, requirePermission } from '@/lib/rbac';
import { writeAudit } from '@/lib/audit';
import type { ActionResult } from '@/types';
import type { Lane } from '@prisma/client';

const zLaneCreate = z.object({
  stationId: z.string(),
  laneNumber: z.number().int().positive(),
  name: z.string().min(1).max(50),
  status: z.enum(['ACTIVE','MAINTENANCE','OFFLINE','CALIBRATION_REQUIRED']).default('ACTIVE'),
  lastCalibration: z.string().optional(),
  nextCalibration: z.string().optional(),
});

export async function createLane(raw: unknown): Promise<ActionResult<Lane>> {
  const parsed = zLaneCreate.safeParse(raw);
  if (!parsed.success) return { ok: false, error: 'Invalid input' };
  const user = await getAuthUser();
  if (!user) return { ok: false, error: 'Unauthorized' };
  try { requirePermission(user, 'lane', 'create'); }
  catch { return { ok: false, error: 'Forbidden' }; }
  const d = parsed.data;
  const l = await prisma.$transaction(async (tx) => {
    const created = await tx.lane.create({
      data: {
        stationId: d.stationId, laneNumber: d.laneNumber, name: d.name,
        status: d.status,
        lastCalibration: d.lastCalibration ? new Date(d.lastCalibration) : null,
        nextCalibration: d.nextCalibration ? new Date(d.nextCalibration) : null,
      },
    });
    await writeAudit({ tx, userId: user.userId, action: 'LANE_CREATED',
      entityType: 'Lane', entityId: created.id, newValues: created });
    return created;
  });
  return { ok: true, data: l };
}

export async function updateLane(raw: unknown): Promise<ActionResult<Lane>> {
  const parsed = zLaneCreate.partial().extend({ id: z.string() }).safeParse(raw);
  if (!parsed.success) return { ok: false, error: 'Invalid input' };
  const user = await getAuthUser();
  if (!user) return { ok: false, error: 'Unauthorized' };
  try { requirePermission(user, 'lane', 'update'); }
  catch { return { ok: false, error: 'Forbidden' }; }
  const { id, lastCalibration, nextCalibration, ...rest } = parsed.data;
  const l = await prisma.$transaction(async (tx) => {
    const before = await tx.lane.findUnique({ where: { id } });
    if (!before) throw new Error('Not found');
    const after = await tx.lane.update({
      where: { id },
      data: {
        ...rest,
        lastCalibration: lastCalibration ? new Date(lastCalibration) : undefined,
        nextCalibration: nextCalibration ? new Date(nextCalibration) : undefined,
      },
    });
    await writeAudit({ tx, userId: user.userId, action: 'LANE_UPDATED',
      entityType: 'Lane', entityId: id, oldValues: before, newValues: after });
    return after;
  });
  return { ok: true, data: l };
}

export async function deleteLane(id: string): Promise<ActionResult<null>> {
  const user = await getAuthUser();
  if (!user) return { ok: false, error: 'Unauthorized' };
  try { requirePermission(user, 'lane', 'delete'); }
  catch { return { ok: false, error: 'Forbidden' }; }
  await prisma.$transaction(async (tx) => {
    await tx.lane.delete({ where: { id } });
    await writeAudit({ tx, userId: user.userId, action: 'LANE_DELETED',
      entityType: 'Lane', entityId: id });
  });
  return { ok: true, data: null };
}

export async function listLanesByStation(stationId: string) {
  const lanes = await prisma.lane.findMany({
    where: { stationId },
    orderBy: { laneNumber: 'asc' },
    include: { equipment: true, _count: { select: { inspections: true } } },
  });
  return { ok: true as const, data: lanes };
}

export async function listAllLanes() {
  const lanes = await prisma.lane.findMany({
    orderBy: [{ stationId: 'asc' }, { laneNumber: 'asc' }],
    include: { station: { select: { name: true } } },
  });
  return { ok: true as const, data: lanes };
}
