// FILE: src/actions/vehicles.ts
// STAGE: 6
// UPDATED: 2026-10-01
'use server';

import { prisma } from '@/lib/prisma';
import { getAuthUser, requirePermission } from '@/lib/rbac';
import { writeAudit } from '@/lib/audit';
import { zVehicleCreate, zVehicleUpdate } from '@/lib/validation/vehicle.schema';
import type { ActionResult } from '@/types';
import type { Vehicle } from '@prisma/client';

export async function createVehicle(raw: unknown): Promise<ActionResult<Vehicle>> {
  const parsed = zVehicleCreate.safeParse(raw);
  if (!parsed.success) return { ok: false, error: 'Invalid input',
    fieldErrors: parsed.error.flatten().fieldErrors };
  const user = await getAuthUser();
  if (!user) return { ok: false, error: 'Unauthorized' };
  try { requirePermission(user, 'vehicle', 'create'); }
  catch { return { ok: false, error: 'Forbidden' }; }

  const v = await prisma.$transaction(async (tx) => {
    const created = await tx.vehicle.create({
      data: {
        plateNumber: parsed.data.plateNumber,
        vin: parsed.data.vin && parsed.data.vin.length === 17 ? parsed.data.vin : null,
        plateCountry: 'Iraq-Kurdistan',
        category: parsed.data.category,
        make: parsed.data.make, model: parsed.data.model,
        year: parsed.data.year, grossWeightKg: parsed.data.grossWeightKg,
        fleetOwnerId: parsed.data.fleetOwnerId,
        stationId: parsed.data.stationId,
      },
    });
    await writeAudit({ tx, userId: user.userId, action: 'VEHICLE_CREATED',
      entityType: 'Vehicle', entityId: created.id, newValues: created });
    return created;
  });
  return { ok: true, data: v };
}

export async function updateVehicle(raw: unknown): Promise<ActionResult<Vehicle>> {
  const parsed = zVehicleUpdate.safeParse(raw);
  if (!parsed.success) return { ok: false, error: 'Invalid input' };
  const user = await getAuthUser();
  if (!user) return { ok: false, error: 'Unauthorized' };
  try { requirePermission(user, 'vehicle', 'update'); }
  catch { return { ok: false, error: 'Forbidden' }; }

  const { id, ...updates } = parsed.data;
  const v = await prisma.$transaction(async (tx) => {
    const before = await tx.vehicle.findUnique({ where: { id } });
    if (!before) throw new Error('Not found');
    const after = await tx.vehicle.update({ where: { id }, data: updates });
    await writeAudit({ tx, userId: user.userId, action: 'VEHICLE_UPDATED',
      entityType: 'Vehicle', entityId: id, oldValues: before, newValues: after });
    return after;
  });
  return { ok: true, data: v };
}

export async function deleteVehicle(id: string): Promise<ActionResult<null>> {
  const user = await getAuthUser();
  if (!user) return { ok: false, error: 'Unauthorized' };
  try { requirePermission(user, 'vehicle', 'delete'); }
  catch { return { ok: false, error: 'Forbidden' }; }
  await prisma.$transaction(async (tx) => {
    await tx.vehicle.delete({ where: { id } });
    await writeAudit({ tx, userId: user.userId, action: 'VEHICLE_DELETED',
      entityType: 'Vehicle', entityId: id });
  });
  return { ok: true, data: null };
}

export async function listVehicles(filter: { search?: string; page?: number;
  pageSize?: number } = {}) {
  const user = await getAuthUser();
  if (!user) return { ok: false as const, error: 'Unauthorized' };
  const page = filter.page ?? 1;
  const pageSize = Math.min(filter.pageSize ?? 20, 100);
  const where: Record<string, unknown> = {};
  if (filter.search) {
    where.OR = [
      { plateNumber: { contains: filter.search, mode: 'insensitive' } },
      { vin: { contains: filter.search, mode: 'insensitive' } },
    ];
  }
  const [rows, total] = await Promise.all([
    prisma.vehicle.findMany({ where, orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize, take: pageSize,
      include: { fleetOwner: true, station: true } }),
    prisma.vehicle.count({ where }),
  ]);
  return { ok: true as const, data: { rows, total, page, pageSize } };
}

export async function getVehicleById(id: string) {
  const user = await getAuthUser();
  if (!user) return { ok: false as const, error: 'Unauthorized' };
  const v = await prisma.vehicle.findUnique({
    where: { id },
    include: { fleetOwner: true, station: true,
      inspections: { orderBy: { createdAt: 'desc' }, take: 10 } },
  });
  if (!v) return { ok: false as const, error: 'Not found' };
  return { ok: true as const, data: v };
}

export async function searchByPlateOrVin(query: string) {
  return listVehicles({ search: query, page: 1, pageSize: 20 });
}

export async function listFleetOwners() {
  return prisma.fleetOwner.findMany({
    where: { isActive: true },
    orderBy: { companyName: 'asc' },
    select: { id: true, companyName: true },
  });
}
