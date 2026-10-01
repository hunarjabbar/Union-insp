// FILE: src/app/api/auth/refresh/route.ts
// STAGE: 5
// UPDATED: 2026-10-01
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyRefreshToken, signAccessToken, signRefreshToken,
         COOKIE_NAME, COOKIE_OPTIONS } from '@/lib/auth';
import { writeAudit } from '@/lib/audit';
import { sha256Hex } from '@/lib/crypto';
import { nanoid } from 'nanoid';

export async function POST() {
  const cookieStore = cookies();
  const refresh = cookieStore.get('union_inspection_refresh')?.value;
  if (!refresh) return NextResponse.json({ error: 'No session' }, { status: 401 });

  let payload: { sub: string; sessionId: string };
  try {
    payload = await verifyRefreshToken(refresh) as { sub: string; sessionId: string };
  } catch {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }

  const session = await prisma.session.findUnique({ where: { id: payload.sessionId } });
  if (!session || session.revokedAt) {
    if (payload.sessionId) {
      await prisma.$transaction(async (tx) => {
        await tx.session.updateMany({
          where: { userId: payload.sub, revokedAt: null },
          data: { revokedAt: new Date(), revokedReason: 'SUSPICIOUS' },
        });
        await writeAudit({ tx, userId: payload.sub,
          action: 'AUTH_TOKEN_REUSE_DETECTED', entityType: 'Session',
          entityId: payload.sessionId });
      });
    }
    return NextResponse.json({ error: 'Session revoked' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || user.status !== 'ACTIVE') {
    return NextResponse.json({ error: 'Invalid user' }, { status: 401 });
  }

  // Rotate: revoke old, create new
  const newSessionId = nanoid();
  const newRefresh = await signRefreshToken({ sub: user.id, sessionId: newSessionId });
  const access = await signAccessToken({
    sub: user.id, role: user.role, email: user.email,
    stationId: user.stationId ?? undefined,
  });

  await prisma.$transaction(async (tx) => {
    await tx.session.update({
      where: { id: session.id },
      data: { revokedAt: new Date(), revokedReason: 'ROTATED' },
    });
    await tx.session.create({
      data: {
        id: newSessionId,
        userId: user.id,
        token: sha256Hex(newRefresh),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60_000),
      },
    });
  });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, access, COOKIE_OPTIONS);
  res.cookies.set('union_inspection_refresh', newRefresh, {
    ...COOKIE_OPTIONS, maxAge: 7 * 24 * 60 * 60,
  });
  return res;
}
