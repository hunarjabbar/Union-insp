// FILE: src/app/api/verify/[code]/route.ts
// STAGE: 11
// UPDATED: 2026-10-02
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyInspectionPayload } from '@/lib/qr';

const WINDOW_MS = 60_000;
const MAX_HITS = 60;
const hits = new Map<string, { count: number; resetAt: number }>();

function rateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || entry.resetAt < now) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= MAX_HITS) return false;
  entry.count += 1;
  return true;
}

export async function GET(
  req: Request,
  { params }: { params: { code: string } }
) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  if (!rateLimit(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const inspection = await prisma.inspection.findUnique({
    where: { inspectionCode: params.code },
    select: {
      inspectionCode: true,
      qrCodeData: true,
      qrSignature: true,
      qrExpiresAt: true,
      overallResult: true,
      createdAt: true,
      stationId: true,
      station: { select: { name: true } },
    },
  });

  if (!inspection || !inspection.qrCodeData || !inspection.qrSignature) {
    return NextResponse.json(
      { valid: false, reason: 'NOT_FOUND' },
      { status: 404 }
    );
  }

  const payload = verifyInspectionPayload(
    inspection.qrCodeData,
    inspection.qrSignature
  );
  if (!payload) {
    return NextResponse.json({ valid: false, reason: 'SIGNATURE_INVALID' });
  }

  const now = new Date();
  if (inspection.qrExpiresAt && inspection.qrExpiresAt < now) {
    return NextResponse.json({
      valid: false,
      reason: 'EXPIRED',
      inspectionCode: inspection.inspectionCode,
      expiresAt: inspection.qrExpiresAt.toISOString(),
    });
  }

  // NEVER return PII — no owner names, no phone, no VIN.
  return NextResponse.json({
    valid: true,
    result: inspection.overallResult ?? 'PENDING',
    inspectionCode: inspection.inspectionCode,
    stationId: inspection.stationId,
    stationName: inspection.station.name,
    issuedAt: inspection.createdAt?.toISOString() ?? null,
    expiresAt: inspection.qrExpiresAt?.toISOString() ?? null,
  });
}
