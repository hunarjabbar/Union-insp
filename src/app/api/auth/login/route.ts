// FILE: src/app/api/auth/login/route.ts
// STAGE: 5
// UPDATED: 2026-10-01
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { verifyPassword, signAccessToken, signRefreshToken,
         COOKIE_NAME, COOKIE_OPTIONS } from '@/lib/auth';
import { writeAudit } from '@/lib/audit';
import { sha256Hex } from '@/lib/crypto';
import { isEnabled } from '@/lib/feature-flags';
import { SignJWT } from 'jose';
import { nanoid } from 'nanoid';

const secretString = process.env.JWT_SECRET || '8b8d4cf56a73c1d94f2953288f6be4e37f694e4da20188efac37bdc51b9e2810';
const JWT_SECRET = new TextEncoder().encode(secretString);

const Body = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const attempts = new Map<string, { count: number; resetAt: number }>();

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }
  const { email, password } = parsed.data;

  // Rate limit
  const key = `${ip}:${email}`;
  const now = Date.now();
  const entry = attempts.get(key);
  if (entry && entry.resetAt > now && entry.count >= 5) {
    return NextResponse.json({ error: 'Too many attempts' }, { status: 429 });
  }
  attempts.set(key, {
    count: (entry?.resetAt && entry.resetAt > now ? entry.count : 0) + 1,
    resetAt: entry?.resetAt && entry.resetAt > now ? entry.resetAt : now + 15 * 60_000,
  });

  // Look up user
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.status !== 'ACTIVE') {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  // Verify password
  const ok = await verifyPassword(user.passwordHash, password);
  if (!ok) {
    await prisma.$transaction(async (tx) => {
      await writeAudit({ tx, userId: user.id, action: 'AUTH_LOGIN_FAILED',
        entityType: 'User', entityId: user.id,
        newValues: { email }, ipAddress: ip });
    });
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  // MFA branch
  if (user.mfaEnabled && isEnabled('MFA_ENFORCEMENT')) {
    const mfaToken = await new SignJWT({ sub: user.id, mfa: true })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('5m')
      .sign(JWT_SECRET);
    await prisma.$transaction(async (tx) => {
      await writeAudit({ tx, userId: user.id, action: 'AUTH_MFA_CHALLENGE',
        entityType: 'User', entityId: user.id, ipAddress: ip });
    });
    return NextResponse.json({ mfaRequired: true, mfaToken });
  }

  // Create session
  const sessionId = nanoid();
  const refreshToken = await signRefreshToken({ sub: user.id, sessionId });
  const accessToken = await signAccessToken({
    sub: user.id, role: user.role, email: user.email,
    stationId: user.stationId ?? undefined,
  });

  await prisma.$transaction(async (tx) => {
    await tx.session.create({
      data: {
        id: sessionId,
        userId: user.id,
        token: sha256Hex(refreshToken),
        ipAddress: ip,
        userAgent: req.headers.get('user-agent') ?? undefined,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60_000),
      },
    });
    await writeAudit({ tx, userId: user.id, action: 'AUTH_LOGIN_SUCCESS',
      entityType: 'User', entityId: user.id, ipAddress: ip });
  });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, accessToken, COOKIE_OPTIONS);
  res.cookies.set('union_inspection_refresh', refreshToken, {
    ...COOKIE_OPTIONS, maxAge: 7 * 24 * 60 * 60,
  });
  return res;
}
