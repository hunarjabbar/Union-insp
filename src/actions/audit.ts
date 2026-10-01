// FILE: src/actions/audit.ts
// STAGE: 6
// UPDATED: 2026-10-01
'use server';

import { prisma } from '@/lib/prisma';
import { getAuthUser, requirePermission } from '@/lib/rbac';
import { verifyChain } from '@/lib/audit';

export async function listAuditLogs(filter: {
  userId?: string; action?: string; entityType?: string;
  from?: string; to?: string; page?: number; pageSize?: number;
} = {}) {
  const user = await getAuthUser();
  if (!user) return { ok: false as const, error: 'Unauthorized' };
  try { requirePermission(user, 'auditLog', 'read'); }
  catch { return { ok: false as const, error: 'Forbidden' }; }

  const page = filter.page ?? 1;
  const pageSize = Math.min(filter.pageSize ?? 50, 200);
  const where: Record<string, unknown> = {};
  if (filter.userId) where.userId = filter.userId;
  if (filter.action) where.action = filter.action;
  if (filter.entityType) where.entityType = filter.entityType;
  if (filter.from || filter.to) {
    where.createdAt = {};
    if (filter.from) (where.createdAt as Record<string, unknown>).gte = new Date(filter.from);
    if (filter.to) (where.createdAt as Record<string, unknown>).lte = new Date(filter.to);
  }

  const [rows, total] = await Promise.all([
    prisma.auditLog.findMany({
      where, orderBy: { sequence: 'desc' },
      skip: (page - 1) * pageSize, take: pageSize,
      include: { user: { select: { fullName: true, role: true } } },
    }),
    prisma.auditLog.count({ where }),
  ]);
  return { ok: true as const, data: { rows, total, page, pageSize } };
}

export async function verifyAuditChain() {
  const user = await getAuthUser();
  if (!user) return { ok: false as const, error: 'Unauthorized' };
  try { requirePermission(user, 'auditLog', 'read'); }
  catch { return { ok: false as const, error: 'Forbidden' }; }
  const result = await verifyChain();
  return { ok: true as const, data: result };
}
