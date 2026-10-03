// FILE: src/app/api/receipts/[id]/verify/route.ts
// STAGE: 13
// UPDATED: 2026-10-02

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const receipt = await prisma.receipt.findUnique({
    where: { id: params.id },
    select: {
      receiptNumber: true,
      qrPayloadUrl: true,
      printedAt: true,
      reprintCount: true,
      inspection: {
        select: { inspectionCode: true },
      },
    },
  });

  if (!receipt) {
    return NextResponse.json({ valid: false, reason: 'NOT_FOUND' }, { status: 404 });
  }

  return NextResponse.json({
    valid: true,
    receiptNumber: receipt.receiptNumber,
    inspectionCode: receipt.inspection.inspectionCode,
    printedAt: receipt.printedAt,
    reprintCount: receipt.reprintCount,
  });
}
