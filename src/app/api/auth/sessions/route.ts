// FILE: src/app/api/auth/sessions/route.ts
// STAGE: 5
// UPDATED: 2026-10-01
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/rbac';
import { writeAudit } from '@/lib/audit';

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sessions = await prisma.session.findMany({
    where: { userId: user.userId, revokedAt: null, expiresAt: { gt: new Date() } },
    select: { id: true, ipAddress: true, userAgent: true, createdAt: true,
              lastSeenAt: true, expiresAt: true },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ sessions });
}

export async function DELETE(req: Request) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { sessionId } = z.object({ sessionId: z.string() })
    .parse(await req.json().catch(() => null));

  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!session || session.userId !== user.userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.session.update({
      where: { id: sessionId },
      data: { revokedAt: new Date(), revokedReason: 'ADMIN_REVOKE' },
    });
    await writeAudit({ tx, userId: user.userId, action: 'AUTH_SESSION_REVOKED',
      entityType: 'Session', entityId: sessionId });
  });

  return NextResponse.json({ ok: true });
}
