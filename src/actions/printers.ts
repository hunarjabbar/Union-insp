// FILE: src/actions/printers.ts
// STAGE: 6
// UPDATED: 2026-10-01
'use server';

import { prisma } from '@/lib/prisma';
import { getAuthUser, requirePermission, requireRole } from '@/lib/rbac';
import { writeAudit } from '@/lib/audit';
import {
  zPrinterCreate, zPrinterUpdate, zPrinterStatusReport,
} from '@/lib/validation/printer.schema';
import type { ActionResult } from '@/types';
import type { PrinterConfig } from '@prisma/client';

export async function createPrinterConfig(raw: unknown): Promise<ActionResult<PrinterConfig>> {
  const parsed = zPrinterCreate.safeParse(raw);
  if (!parsed.success) return { ok: false, error: 'Invalid input',
    fieldErrors: parsed.error.flatten().fieldErrors };
  const user = await getAuthUser();
  if (!user) return { ok: false, error: 'Unauthorized' };
  try { requirePermission(user, 'printer', 'create'); }
  catch { return { ok: false, error: 'Forbidden' }; }
  const p = await prisma.$transaction(async (tx) => {
    const created = await tx.printerConfig.create({ data: parsed.data });
    await writeAudit({ tx, userId: user.userId, action: 'PRINTER_CREATED',
      entityType: 'PrinterConfig', entityId: created.id,
      newValues: { name: created.name, connectionType: created.connectionType } });
    return created;
  });
  return { ok: true, data: p };
}

export async function updatePrinterConfig(raw: unknown): Promise<ActionResult<PrinterConfig>> {
  const parsed = zPrinterUpdate.safeParse(raw);
  if (!parsed.success) return { ok: false, error: 'Invalid input' };
  const user = await getAuthUser();
  if (!user) return { ok: false, error: 'Unauthorized' };
  try { requirePermission(user, 'printer', 'update'); }
  catch { return { ok: false, error: 'Forbidden' }; }
  const { id, ...updates } = parsed.data;
  const p = await prisma.$transaction(async (tx) => {
    const before = await tx.printerConfig.findUnique({ where: { id } });
    if (!before) throw new Error('Not found');
    const after = await tx.printerConfig.update({ where: { id }, data: updates });
    await writeAudit({ tx, userId: user.userId, action: 'PRINTER_UPDATED',
      entityType: 'PrinterConfig', entityId: id,
      oldValues: before, newValues: after });
    return after;
  });
  return { ok: true, data: p };
}

export async function deletePrinterConfig(id: string): Promise<ActionResult<null>> {
  const user = await getAuthUser();
  if (!user) return { ok: false, error: 'Unauthorized' };
  try { requireRole(user, ['SUPER_ADMIN']); }
  catch { return { ok: false, error: 'Forbidden' }; }
  await prisma.$transaction(async (tx) => {
    await tx.printerConfig.delete({ where: { id } });
    await writeAudit({ tx, userId: user.userId, action: 'PRINTER_DELETED',
      entityType: 'PrinterConfig', entityId: id });
  });
  return { ok: true, data: null };
}

export async function listPrinterConfigs(stationId?: string) {
  const printers = await prisma.printerConfig.findMany({
    where: stationId ? { stationId } : {},
    orderBy: [{ stationId: 'asc' }, { name: 'asc' }],
    include: { station: { select: { name: true } }, lane: { select: { name: true } } },
  });
  return { ok: true as const, data: printers };
}

export async function getDefaultPrinter(stationId: string) {
  const p = await prisma.printerConfig.findFirst({
    where: { stationId, isDefault: true },
  });
  return { ok: true as const, data: p };
}

export async function reportPrinterStatus(raw: unknown): Promise<ActionResult<PrinterConfig>> {
  const parsed = zPrinterStatusReport.safeParse(raw);
  if (!parsed.success) return { ok: false, error: 'Invalid input' };
  const user = await getAuthUser();
  if (!user) return { ok: false, error: 'Unauthorized' };

  const { id, status, error } = parsed.data;
  const p = await prisma.$transaction(async (tx) => {
    const updated = await tx.printerConfig.update({
      where: { id },
      data: {
        status,
        lastSeenAt: new Date(),
        lastError: error ?? null,
        lastErrorAt: error ? new Date() : null,
      },
    });
    await writeAudit({ tx, userId: user.userId, action: 'PRINTER_STATUS_CHANGED',
      entityType: 'PrinterConfig', entityId: id,
      newValues: { status, error } });
    return updated;
  });
  return { ok: true, data: p };
}
