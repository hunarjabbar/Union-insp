// FILE: src/app/api/auth/cashier-pin/route.ts
// STAGE: 5
// UPDATED: 2026-10-01
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyPassword, signAccessToken, COOKIE_NAME,
         COOKIE_OPTIONS } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { writeAudit } from '@/lib/audit';

const Body = z.object({
  stationId: z.string(),
  pin: z.string().length(6),
});

const attempts = new Map<string, { count: number; resetAt: number }>();

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }
  const { stationId, pin } = parsed.data;

  const now = Date.now();
  const entry = attempts.get(stationId);
  if (entry && entry.resetAt > now && entry.count >= 3) {
    return NextResponse.json({ error: 'Too many attempts' }, { status: 429 });
  }
  attempts.set(stationId, {
    count: (entry?.resetAt && entry.resetAt > now ? entry.count : 0) + 1,
    resetAt: entry?.resetAt && entry.resetAt > now ? entry.resetAt : now + 5 * 60_000,
  });

  const cashiers = await prisma.user.findMany({
    where: { role: 'CASHIER', status: 'ACTIVE', stationId },
  });

  let matched = null;
  for (const c of cashiers) {
    if (!c.mfaSecret?.startsWith('PIN:')) continue;
    const hash = c.mfaSecret.slice(4);
    if (await verifyPassword(hash, pin)) { matched = c; break; }
  }

  if (!matched) {
    await prisma.$transaction(async (tx) => {
      await writeAudit({ tx, userId: null, action: 'CASHIER_PIN_LOGIN_FAILED',
        entityType: 'Station', entityId: stationId });
    });
    return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 });
  }

  const access = await signAccessToken({
    sub: matched.id, role: matched.role, email: matched.email,
    stationId: matched.stationId ?? undefined,
  });

  await prisma.$transaction(async (tx) => {
    await writeAudit({ tx, userId: matched.id,
      action: 'CASHIER_PIN_LOGIN_SUCCESS', entityType: 'User',
      entityId: matched.id });
  });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, access, { ...COOKIE_OPTIONS, maxAge: 4 * 60 * 60 });
  return res;
}
