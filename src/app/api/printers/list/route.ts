// FILE: src/app/api/printers/list/route.ts
// STAGE: 9
// UPDATED: 2026-10-02
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/rbac';
import { listPrinterConfigs } from '@/actions/printers';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Super admins see all printers; other personnel see their local station printers
  const stationId = user.role === 'SUPER_ADMIN' ? undefined : (user.stationId ?? undefined);
  const result = await listPrinterConfigs(stationId);

  return NextResponse.json({ data: result.data });
}
