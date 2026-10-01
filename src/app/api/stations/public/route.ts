// FILE: src/app/api/stations/public/route.ts
// STAGE: 5
// UPDATED: 2026-10-01
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const stations = await prisma.station.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });
  return NextResponse.json(stations);
}
