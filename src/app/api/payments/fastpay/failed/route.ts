// FILE: src/app/api/payments/fastpay/failed/route.ts
// STAGE: 12
// UPDATED: 2026-10-02

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { writeAudit } from '@/lib/audit';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const orderId = searchParams.get('order_id');

  if (orderId) {
    try {
      const payment = await prisma.payment.findUnique({
        where: { idempotencyKey: orderId },
        include: { inspection: true },
      });
      if (payment && payment.status === 'PENDING') {
        await prisma.$transaction(async (tx) => {
          await tx.payment.update({
            where: { id: payment.id },
            data: { status: 'FAILED', failureReason: 'User cancelled or failed at gateway' },
          });
          await writeAudit({
            tx,
            userId: payment.inspection.inspectorId || 'SYSTEM',
            inspectionId: payment.inspectionId,
            action: 'PAYMENT_FAILED',
            entityType: 'Payment',
            entityId: payment.id,
            newValues: { provider: 'FASTPAY', source: 'fastpay_failed' },
          });
        });
      }
    } catch {
      // Ignored
    }
  }

  return NextResponse.redirect(new URL('/inspection/new?payment=failed', req.url));
}
// 
