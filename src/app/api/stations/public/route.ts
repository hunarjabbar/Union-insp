// FILE: src/app/api/stations/public/route.ts
// STAGE: FIX-LOGIN
// UPDATED: 2026-10-05

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const stations = await prisma.station.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(stations);
  } catch (err) {
    console.error('[STATIONS PUBLIC 500]', err);
    return NextResponse.json(
      { error: 'Internal server error', detail: String(err) },
      { status: 500 }
    );
  }
}