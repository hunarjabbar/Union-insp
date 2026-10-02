// FILE: src/app/api/printers/default/route.ts
// STAGE: 7
// UPDATED: 2026-10-02
import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/rbac';
import { getDefaultPrinter } from '@/actions/printers';

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!user.stationId) {
    return NextResponse.json(null);
  }
  const result = await getDefaultPrinter(user.stationId);
  return NextResponse.json(result.ok ? result.data : null);
}
