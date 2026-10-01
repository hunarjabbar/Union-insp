// FILE: src/app/api/auth/mfa/verify/route.ts
// STAGE: 5
// UPDATED: 2026-10-01
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { jwtVerify } from 'jose';
import { verify } from 'otplib';
import { prisma } from '@/lib/prisma';
import { signAccessToken, signRefreshToken, COOKIE_NAME,
         COOKIE_OPTIONS } from '@/lib/auth';
import { writeAudit } from '@/lib/audit';
import { sha256Hex } from '@/lib/crypto';
import { nanoid } from 'nanoid';

const secretString = process.env.JWT_SECRET || '8b8d4cf56a73c1d94f2953288f6be4e37f694e4da20188efac37bdc51b9e2810';
const JWT_SECRET = new TextEncoder().encode(secretString);

const Body = z.object({
  mfaToken: z.string(),
  code: z.string().length(6),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }
  const { mfaToken, code } = parsed.data;

  let sub: string;
  try {
    const { payload } = await jwtVerify(
      mfaToken,
      JWT_SECRET,
      { algorithms: ['HS256'] },
    );
    if (!payload.mfa) throw new Error('not mfa token');
    sub = payload.sub as string;
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: sub } });
  if (!user || !user.mfaSecret || user.mfaSecret.startsWith('PIN:')) {
    return NextResponse.json({ error: 'MFA not configured' }, { status: 400 });
  }

  const { valid } = await verify({ token: code, secret: user.mfaSecret });
  if (!valid) {
    await prisma.$transaction(async (tx) => {
      await writeAudit({ tx, userId: user.id, action: 'AUTH_MFA_FAILED',
        entityType: 'User', entityId: user.id });
    });
    return NextResponse.json({ error: 'Invalid code' }, { status: 401 });
  }

  const sessionId = nanoid();
  const refresh = await signRefreshToken({ sub: user.id, sessionId });
  const access = await signAccessToken({
    sub: user.id, role: user.role, email: user.email,
    stationId: user.stationId ?? undefined,
  });

  await prisma.$transaction(async (tx) => {
    await tx.session.create({
      data: {
        id: sessionId,
        userId: user.id,
        token: sha256Hex(refresh),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60_000),
      },
    });
    await writeAudit({ tx, userId: user.id, action: 'AUTH_MFA_SUCCESS',
      entityType: 'User', entityId: user.id });
  });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, access, COOKIE_OPTIONS);
  res.cookies.set('union_inspection_refresh', refresh, {
    ...COOKIE_OPTIONS, maxAge: 7 * 24 * 60 * 60,
  });
  return res;
}
