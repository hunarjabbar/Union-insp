// FILE: src/app/api/auth/me/route.ts
// STAGE: 5
// UPDATED: 2026-10-01
import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/rbac';

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json(user);
}
