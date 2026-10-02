// FILE: src/app/verify/[code]/page.tsx
// STAGE: 11
// UPDATED: 2026-10-02
import * as React from 'react';
import { prisma } from '@/lib/prisma';
import { verifyInspectionPayload } from '@/lib/qr';
import { VerifyResultCard } from '@/components/public/VerifyResultCard';

export const dynamic = 'force-dynamic';

async function loadResult(code: string) {
  const inspection = await prisma.inspection.findUnique({
    where: { inspectionCode: code },
    select: {
      inspectionCode: true,
      qrCodeData: true,
      qrSignature: true,
      qrExpiresAt: true,
      overallResult: true,
      createdAt: true,
      station: { select: { name: true } },
    },
  });
  if (!inspection) return { kind: 'not_found' as const };

  const payload = inspection.qrCodeData && inspection.qrSignature
    ? verifyInspectionPayload(inspection.qrCodeData, inspection.qrSignature)
    : null;
  if (!payload) return { kind: 'invalid' as const };

  if (inspection.qrExpiresAt && inspection.qrExpiresAt < new Date()) {
    return {
      kind: 'expired' as const,
      inspectionCode: inspection.inspectionCode,
      expiresAt: inspection.qrExpiresAt,
    };
  }
  return {
    kind: 'valid' as const,
    inspectionCode: inspection.inspectionCode,
    result: inspection.overallResult ?? 'PENDING',
    stationName: inspection.station.name,
    issuedAt: inspection.createdAt,
    expiresAt: inspection.qrExpiresAt,
  };
}

export default async function VerifyPage({
  params,
}: { params: { code: string } }) {
  const result = await loadResult(params.code);
  return <VerifyResultCard result={result} code={params.code} />;
}
