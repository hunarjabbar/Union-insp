// FILE: src/actions/stations.ts
// STAGE: 6
// UPDATED: 2026-10-01
'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthUser, requirePermission } from '@/lib/rbac';
import { writeAudit } from '@/lib/audit';
import type { ActionResult } from '@/types';
import type { Station } from '@prisma/client';
import { nanoid } from 'nanoid';

const zStationCreate = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(100),
  nameAr: z.string().min(1),
  nameKu: z.string().min(1),
  type: z.enum(['BORDER_TERMINAL', 'CITY_CENTER_CHECKPOINT']),
  address: z.string().min(1),
  latitude: z.number(),
  longitude: z.number(),
  isActive: z.boolean().default(true),
});

export async function createStation(raw: unknown): Promise<ActionResult<Station>> {
  const parsed = zStationCreate.safeParse(raw);
  if (!parsed.success) return { ok: false, error: 'Invalid input' };
  const user = await getAuthUser();
  if (!user) return { ok: false, error: 'Unauthorized' };
  try { requirePermission(user, 'station', 'create'); }
  catch { return { ok: false, error: 'Forbidden' }; }
  
  const data = { ...parsed.data, id: parsed.data.id ?? nanoid() };
  const s = await prisma.$transaction(async (tx) => {
    const created = await tx.station.create({ data });
    await writeAudit({ tx, userId: user.userId, action: 'STATION_CREATED',
      entityType: 'Station', entityId: created.id, newValues: created });
    return created;
  });
  return { ok: true, data: s };
}

export async function updateStation(raw: unknown): Promise<ActionResult<Station>> {
  const parsed = zStationCreate.partial().extend({ id: z.string() }).safeParse(raw);
  if (!parsed.success) return { ok: false, error: 'Invalid input' };
  const user = await getAuthUser();
  if (!user) return { ok: false, error: 'Unauthorized' };
  try { requirePermission(user, 'station', 'update'); }
  catch { return { ok: false, error: 'Forbidden' }; }
  const { id, ...updates } = parsed.data;
  const s = await prisma.$transaction(async (tx) => {
    const before = await tx.station.findUnique({ where: { id } });
    if (!before) throw new Error('Not found');
    const after = await tx.station.update({ where: { id }, data: updates });
    await writeAudit({ tx, userId: user.userId, action: 'STATION_UPDATED',
      entityType: 'Station', entityId: id, oldValues: before, newValues: after });
    return after;
  });
  return { ok: true, data: s };
}

export async function deleteStation(id: string): Promise<ActionResult<null>> {
  const user = await getAuthUser();
  if (!user) return { ok: false, error: 'Unauthorized' };
  try { requirePermission(user, 'station', 'delete'); }
  catch { return { ok: false, error: 'Forbidden' }; }
  await prisma.$transaction(async (tx) => {
    await tx.station.update({ where: { id }, data: { isActive: false } });
    await writeAudit({ tx, userId: user.userId, action: 'STATION_DEACTIVATED',
      entityType: 'Station', entityId: id });
  });
  return { ok: true, data: null };
}

export async function listStations() {
  const stations = await prisma.station.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { lanes: true, users: true } } },
  });
  return { ok: true as const, data: stations };
}

export async function getStationById(id: string) {
  const s = await prisma.station.findUnique({
    where: { id },
    include: { lanes: true, equipment: true, printerConfigs: true },
  });
  if (!s) return { ok: false as const, error: 'Not found' };
  return { ok: true as const, data: s };
}
