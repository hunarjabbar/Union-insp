// FILE: src/app/(dashboard)/settings/security/page.tsx
// STAGE: 14
// UPDATED: 2026-10-03

import React from 'react';
import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/rbac';
import { prisma } from '@/lib/prisma';
import { writeAudit } from '@/lib/audit';
import { SecurityActionsPanel, type SessionItem } from '@/components/settings/SecurityActionsPanel';

export const dynamic = 'force-dynamic';

export default async function SecuritySettingsPage() {
  const auth = await getAuthUser();
  if (!auth) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      mfaEnabled: true,
      lastLoginAt: true,
    },
  });

  if (!user) {
    redirect('/login');
  }

  const rawSessions = await prisma.session.findMany({
    where: {
      userId: user.id,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

  const sessions: SessionItem[] = rawSessions.map((s, idx) => ({
    id: s.id,
    userAgent: s.userAgent,
    ipAddress: s.ipAddress,
    createdAt: s.createdAt.toISOString(),
    lastSeenAt: s.lastSeenAt?.toISOString() ?? null,
    isCurrent: idx === 0, // Most recent session is active
  }));

  async function revokeSessionAction(sessionId: string) {
    'use server';
    const currentUser = await getAuthUser();
    if (!currentUser) return { ok: false, error: 'Unauthorized' };

    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!session) return { ok: false, error: 'Session not found' };
    if (session.userId !== currentUser.userId && currentUser.role !== 'SUPER_ADMIN') {
      return { ok: false, error: 'Forbidden' };
    }

    await prisma.$transaction(async (tx) => {
      await tx.session.update({
        where: { id: sessionId },
        data: { revokedAt: new Date(), revokedReason: 'USER_REVOKED' },
      });
      await writeAudit({
        tx,
        userId: currentUser.userId,
        action: 'SESSION_REVOKED',
        entityType: 'Session',
        entityId: sessionId,
      });
    });

    return { ok: true };
  }

  async function revokeAllSessionsAction() {
    'use server';
    const currentUser = await getAuthUser();
    if (!currentUser) return { ok: false, error: 'Unauthorized' };

    await prisma.$transaction(async (tx) => {
      await tx.session.updateMany({
        where: { userId: currentUser.userId, revokedAt: null },
        data: { revokedAt: new Date(), revokedReason: 'USER_REVOKED_ALL' },
      });
      await writeAudit({
        tx,
        userId: currentUser.userId,
        action: 'ALL_SESSIONS_REVOKED',
        entityType: 'User',
        entityId: currentUser.userId,
      });
    });

    return { ok: true };
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Security & Authorization</h1>
        <p className="text-sm text-muted-foreground">
          Manage your terminal credentials, multi-factor tokens, and active sessions.
        </p>
      </div>

      <SecurityActionsPanel
        userId={user.id}
        mfaEnabled={user.mfaEnabled}
        lastLoginAt={user.lastLoginAt ? user.lastLoginAt.toISOString() : null}
        sessions={sessions}
        onRevokeSession={revokeSessionAction}
        onRevokeAllSessions={revokeAllSessionsAction}
      />
    </div>
  );
}
