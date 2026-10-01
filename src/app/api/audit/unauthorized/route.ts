// FILE: src/app/api/audit/unauthorized/route.ts
// STAGE: 5
// UPDATED: 2026-10-01
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { writeAudit } from '@/lib/audit';

const Body = z.object({
  pathname: z.string(),
  userRole: z.string().optional(),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: true });

  await prisma.$transaction(async (tx) => {
    await writeAudit({ tx, userId: null, action: 'ACCESS_DENIED',
      entityType: 'Route', entityId: parsed.data.pathname,
      newValues: { userRole: parsed.data.userRole } });
  });
  return NextResponse.json({ ok: true });
}
