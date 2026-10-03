// FILE: src/app/api/receipts/[id]/pdf/route.ts
// STAGE: 13
// UPDATED: 2026-10-02

import { NextResponse } from 'next/server';
import { getAuthUser, requirePermission } from '@/lib/rbac';
import { getReceiptPayload } from '@/actions/receipts';
import { renderReceiptPdf } from '@/lib/print/pdf';
import { prisma } from '@/lib/prisma';
import { writeAudit } from '@/lib/audit';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const user = await getAuthUser();
  if (!user) return new NextResponse('Unauthorized', { status: 401 });
  try {
    requirePermission(user, 'receipt', 'read');
  } catch {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const payloadRes = await getReceiptPayload(params.id);
  if (!payloadRes.ok) {
    return new NextResponse('Not found', { status: 404 });
  }

  const rawPayload = payloadRes.data;
  const pdf = await renderReceiptPdf({
    ...rawPayload,
    issuedAt: new Date(rawPayload.issuedAt),
  });

  // Audit log
  await prisma.$transaction(async (tx) => {
    await writeAudit({
      tx,
      userId: user.userId,
      action: 'RECEIPT_PDF_DOWNLOADED',
      entityType: 'Receipt',
      entityId: params.id,
    });
  });

  return new NextResponse(pdf as unknown as BodyInit, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${payloadRes.data.receiptNumber}.pdf"`,
      'Cache-Control': 'private, max-age=300',
    },
  });
}
