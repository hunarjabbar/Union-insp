// FILE: src/app/api/auth/logout/route.ts
// STAGE: 5
// UPDATED: 2026-10-01
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { writeAudit } from '@/lib/audit';
import { sha256Hex } from '@/lib/crypto';
import { getAuthUser } from '@/lib/rbac';

export async function POST() {
  const user = await getAuthUser();
  const cookieStore = cookies();
  const refresh = cookieStore.get('union_inspection_refresh')?.value;

  if (refresh) {
    const hash = sha256Hex(refresh);
    const session = await prisma.session.findUnique({ where: { token: hash } });
    if (session) {
      await prisma.$transaction(async (tx) => {
        await tx.session.update({
          where: { id: session.id },
          data: { revokedAt: new Date(), revokedReason: 'LOGOUT' },
        });
        await writeAudit({ tx, userId: user?.userId ?? null,
          action: 'AUTH_SESSION_REVOKED', entityType: 'Session',
          entityId: session.id });
      });
    }
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.delete('union_inspection_token');
  res.cookies.delete('union_inspection_refresh');
  return res;
}
