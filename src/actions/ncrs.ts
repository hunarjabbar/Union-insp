// FILE: src/actions/ncrs.ts
// STAGE: 6
// UPDATED: 2026-10-01
'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthUser, requirePermission, requireRole } from '@/lib/rbac';
import { writeAudit } from '@/lib/audit';
import { generateNcrNumber } from '@/lib/utils';
import type { ActionResult } from '@/types';
import type { NCR } from '@prisma/client';

const zNcrCreate = z.object({
  inspectionId: z.string().optional(),
  stationId: z.string().optional(),
  isoStandard: z.enum(['ISO_17020','ISO_27001','ISO_9001','ISO_39001']).optional(),
  title: z.string().min(3).max(200),
  description: z.string().min(10),
  severity: z.enum(['CRITICAL','MAJOR','MINOR','ADVISORY']),
  assignedTo: z.string().optional(),
  dueDate: z.string().optional(),
});

const zNcrAction = z.object({
  id: z.string(),
  rootCause: z.string().optional(),
  correctiveAction: z.string().optional(),
  preventiveAction: z.string().optional(),
});

export async function createNcr(raw: unknown): Promise<ActionResult<NCR>> {
  const parsed = zNcrCreate.safeParse(raw);
  if (!parsed.success) return { ok: false, error: 'Invalid input' };
  const user = await getAuthUser();
  if (!user) return { ok: false, error: 'Unauthorized' };
  try { requirePermission(user, 'ncr', 'create'); }
  catch { return { ok: false, error: 'Forbidden' }; }

  const d = parsed.data;
  const ncr = await prisma.$transaction(async (tx) => {
    const created = await tx.nCR.create({
      data: {
        ncrNumber: generateNcrNumber(),
        inspectionId: d.inspectionId, stationId: d.stationId,
        isoStandard: d.isoStandard, title: d.title, description: d.description,
        severity: d.severity, createdBy: user.userId, raisedById: user.userId,
        assignedTo: d.assignedTo,
        dueDate: d.dueDate ? new Date(d.dueDate) : null,
      },
    });
    await writeAudit({ tx, userId: user.userId, action: 'NCR_CREATED',
      entityType: 'NCR', entityId: created.id,
      newValues: { ncrNumber: created.ncrNumber, severity: created.severity } });
    return created;
  });
  return { ok: true, data: ncr };
}

export async function assignNcr(id: string, assigneeId: string): Promise<ActionResult<NCR>> {
  const user = await getAuthUser();
  if (!user) return { ok: false, error: 'Unauthorized' };
  try { requirePermission(user, 'ncr', 'update'); }
  catch { return { ok: false, error: 'Forbidden' }; }
  const ncr = await prisma.$transaction(async (tx) => {
    const updated = await tx.nCR.update({
      where: { id },
      data: { assignedTo: assigneeId, status: 'INVESTIGATING' },
    });
    await writeAudit({ tx, userId: user.userId, action: 'NCR_ASSIGNED',
      entityType: 'NCR', entityId: id, newValues: { assignedTo: assigneeId } });
    return updated;
  });
  return { ok: true, data: ncr };
}

export async function resolveNcr(raw: unknown): Promise<ActionResult<NCR>> {
  const parsed = zNcrAction.safeParse(raw);
  if (!parsed.success) return { ok: false, error: 'Invalid input' };
  const user = await getAuthUser();
  if (!user) return { ok: false, error: 'Unauthorized' };
  try { requirePermission(user, 'ncr', 'update'); }
  catch { return { ok: false, error: 'Forbidden' }; }
  const { id, ...fields } = parsed.data;
  const ncr = await prisma.$transaction(async (tx) => {
    const updated = await tx.nCR.update({
      where: { id },
      data: { ...fields, status: 'RESOLVED', resolvedAt: new Date() },
    });
    await writeAudit({ tx, userId: user.userId, action: 'NCR_RESOLVED',
      entityType: 'NCR', entityId: id, newValues: fields });
    return updated;
  });
  return { ok: true, data: ncr };
}

export async function closeNcr(id: string): Promise<ActionResult<NCR>> {
  const user = await getAuthUser();
  if (!user) return { ok: false, error: 'Unauthorized' };
  try { requireRole(user, ['SUPER_ADMIN', 'COMPLIANCE_AUDITOR']); }
  catch { return { ok: false, error: 'Forbidden' }; }
  const ncr = await prisma.$transaction(async (tx) => {
    const updated = await tx.nCR.update({
      where: { id },
      data: { status: 'CLOSED', closedAt: new Date() },
    });
    await writeAudit({ tx, userId: user.userId, action: 'NCR_CLOSED',
      entityType: 'NCR', entityId: id });
    return updated;
  });
  return { ok: true, data: ncr };
}

export async function listNcrs(filter: { status?: string; stationId?: string } = {}) {
  const where: Record<string, unknown> = {};
  if (filter.status) where.status = filter.status;
  if (filter.stationId) where.stationId = filter.stationId;
  const ncrs = await prisma.nCR.findMany({
    where, orderBy: { createdAt: 'desc' },
    include: { raisedBy: { select: { fullName: true } } },
  });
  return { ok: true as const, data: ncrs };
}

export async function getNcrById(id: string) {
  const ncr = await prisma.nCR.findUnique({
    where: { id },
    include: { raisedBy: { select: { fullName: true, email: true } },
      inspection: { select: { inspectionCode: true } } },
  });
  if (!ncr) return { ok: false as const, error: 'Not found' };
  return { ok: true as const, data: ncr };
}
