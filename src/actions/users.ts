// FILE: src/actions/users.ts
// STAGE: 6
// UPDATED: 2026-10-01
'use server';

import { prisma } from '@/lib/prisma';
import { getAuthUser, requireRole } from '@/lib/rbac';
import { writeAudit } from '@/lib/audit';
import { hashPassword } from '@/lib/auth';
import {
  zUserCreate, zUserUpdate, zUserRoleChange,
} from '@/lib/validation/user.schema';
import type { ActionResult } from '@/types';
import type { User } from '@prisma/client';

function scrub(u: User) {
  const { passwordHash, mfaSecret, ...rest } = u;
  void passwordHash; void mfaSecret;
  return rest;
}

export async function createUser(raw: unknown): Promise<ActionResult<Omit<User, 'passwordHash' | 'mfaSecret'>>> {
  const parsed = zUserCreate.safeParse(raw);
  if (!parsed.success) return { ok: false, error: 'Invalid input',
    fieldErrors: parsed.error.flatten().fieldErrors };
  const admin = await getAuthUser();
  if (!admin) return { ok: false, error: 'Unauthorized' };
  try { requireRole(admin, ['SUPER_ADMIN']); }
  catch { return { ok: false, error: 'Forbidden' }; }

  const { password, ...rest } = parsed.data;
  const passwordHash = await hashPassword(password);

  const u = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: { ...rest, passwordHash, status: 'ACTIVE' },
    });
    await writeAudit({ tx, userId: admin.userId, action: 'USER_CREATED',
      entityType: 'User', entityId: created.id,
      newValues: { email: created.email, role: created.role } });
    return created;
  });
  return { ok: true, data: scrub(u) };
}

export async function updateUser(raw: unknown): Promise<ActionResult<Omit<User, 'passwordHash' | 'mfaSecret'>>> {
  const parsed = zUserUpdate.safeParse(raw);
  if (!parsed.success) return { ok: false, error: 'Invalid input' };
  const admin = await getAuthUser();
  if (!admin) return { ok: false, error: 'Unauthorized' };
  try { requireRole(admin, ['SUPER_ADMIN']); }
  catch { return { ok: false, error: 'Forbidden' }; }
  const { id, ...updates } = parsed.data;
  const u = await prisma.$transaction(async (tx) => {
    const before = await tx.user.findUnique({ where: { id } });
    if (!before) throw new Error('Not found');
    const after = await tx.user.update({ where: { id }, data: updates });
    await writeAudit({ tx, userId: admin.userId, action: 'USER_UPDATED',
      entityType: 'User', entityId: id,
      oldValues: { fullName: before.fullName, stationId: before.stationId },
      newValues: { fullName: after.fullName, stationId: after.stationId } });
    return after;
  });
  return { ok: true, data: scrub(u) };
}

export async function changeUserRole(raw: unknown): Promise<ActionResult<Omit<User, 'passwordHash' | 'mfaSecret'>>> {
  const parsed = zUserRoleChange.safeParse(raw);
  if (!parsed.success) return { ok: false, error: 'Invalid input' };
  const admin = await getAuthUser();
  if (!admin) return { ok: false, error: 'Unauthorized' };
  try { requireRole(admin, ['SUPER_ADMIN']); }
  catch { return { ok: false, error: 'Forbidden' }; }
  const { id, role } = parsed.data;
  const u = await prisma.$transaction(async (tx) => {
    const before = await tx.user.findUnique({ where: { id } });
    if (!before) throw new Error('Not found');
    const after = await tx.user.update({ where: { id }, data: { role } });
    await tx.session.updateMany({
      where: { userId: id, revokedAt: null },
      data: { revokedAt: new Date(), revokedReason: 'ROLE_CHANGE' },
    });
    await writeAudit({ tx, userId: admin.userId, action: 'USER_ROLE_CHANGED',
      entityType: 'User', entityId: id,
      oldValues: { role: before.role }, newValues: { role: after.role } });
    return after;
  });
  return { ok: true, data: scrub(u) };
}

export async function suspendUser(id: string): Promise<ActionResult<null>> {
  const admin = await getAuthUser();
  if (!admin) return { ok: false, error: 'Unauthorized' };
  try { requireRole(admin, ['SUPER_ADMIN']); }
  catch { return { ok: false, error: 'Forbidden' }; }
  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id }, data: { status: 'SUSPENDED' } });
    await tx.session.updateMany({
      where: { userId: id, revokedAt: null },
      data: { revokedAt: new Date(), revokedReason: 'ADMIN_REVOKE' },
    });
    await writeAudit({ tx, userId: admin.userId, action: 'USER_SUSPENDED',
      entityType: 'User', entityId: id });
  });
  return { ok: true, data: null };
}

export async function reactivateUser(id: string): Promise<ActionResult<null>> {
  const admin = await getAuthUser();
  if (!admin) return { ok: false, error: 'Unauthorized' };
  try { requireRole(admin, ['SUPER_ADMIN']); }
  catch { return { ok: false, error: 'Forbidden' }; }
  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id }, data: { status: 'ACTIVE' } });
    await writeAudit({ tx, userId: admin.userId, action: 'USER_REACTIVATED',
      entityType: 'User', entityId: id });
  });
  return { ok: true, data: null };
}

export async function revokeAllSessions(userId: string): Promise<ActionResult<null>> {
  const admin = await getAuthUser();
  if (!admin) return { ok: false, error: 'Unauthorized' };
  try { requireRole(admin, ['SUPER_ADMIN']); }
  catch { return { ok: false, error: 'Forbidden' }; }
  await prisma.$transaction(async (tx) => {
    await tx.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date(), revokedReason: 'ADMIN_REVOKE' },
    });
    await writeAudit({ tx, userId: admin.userId, action: 'USER_SESSIONS_REVOKED',
      entityType: 'User', entityId: userId });
  });
  return { ok: true, data: null };
}

export async function listUsers(filter: { search?: string; role?: string } = {}) {
  const admin = await getAuthUser();
  if (!admin) return { ok: false as const, error: 'Unauthorized' };
  const where: Record<string, unknown> = {};
  if (filter.role) where.role = filter.role;
  if (filter.search) {
    where.OR = [
      { email: { contains: filter.search, mode: 'insensitive' } },
      { fullName: { contains: filter.search, mode: 'insensitive' } },
    ];
  }
  const users = await prisma.user.findMany({
    where, orderBy: { createdAt: 'desc' },
    select: { id: true, email: true, fullName: true, role: true,
              status: true, stationId: true, lastLoginAt: true,
              mfaEnabled: true, createdAt: true, station: { select: { name: true } } },
  });
  return { ok: true as const, data: users };
}

export async function getUserById(id: string) {
  const admin = await getAuthUser();
  if (!admin) return { ok: false as const, error: 'Unauthorized' };
  const u = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, fullName: true, role: true,
              status: true, stationId: true, lastLoginAt: true,
              mfaEnabled: true, createdAt: true, station: { select: { name: true } } },
  });
  if (!u) return { ok: false as const, error: 'Not found' };
  return { ok: true as const, data: u };
}
