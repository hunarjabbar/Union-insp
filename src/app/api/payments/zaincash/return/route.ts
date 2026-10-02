// FILE: src/app/api/payments/zaincash/return/route.ts
// STAGE: 12
// UPDATED: 2026-10-02

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPaymentProvider } from '@/lib/payments';
import { writeAudit } from '@/lib/audit';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(new URL('/inspection/new?payment=failed', req.url));
  }

  try {
    const payment = await prisma.payment.findFirst({
      where: {
        OR: [
          { gatewayRef: token },
          { idempotencyKey: token },
        ],
      },
      include: { inspection: true },
    });

    if (!payment) {
      return NextResponse.redirect(new URL('/inspection/new?payment=failed', req.url));
    }

    const adapter = getPaymentProvider('ZAINCASH');
    const latestStatus = await adapter.checkStatus(payment.gatewayRef || token);

    if (latestStatus === 'COMPLETED' && payment.status !== 'COMPLETED') {
      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: payment.id },
          data: { status: 'COMPLETED', completedAt: new Date() },
        });
        await tx.inspection.update({
          where: { id: payment.inspectionId },
          data: { paymentStatus: 'COLLECTED', paymentMethod: 'ZAINCASH' },
        });
        await writeAudit({
          tx,
          userId: payment.inspection.inspectorId || 'SYSTEM',
          inspectionId: payment.inspectionId,
          action: 'PAYMENT_COMPLETED',
          entityType: 'Payment',
          entityId: payment.id,
          newValues: { provider: 'ZAINCASH', amountIqd: payment.amountIqd, source: 'zaincash_return' },
        });
      });
    }

    return NextResponse.redirect(new URL(`/inspection/new?payment=success&inspectionId=${payment.inspectionId}`, req.url));
  } catch (error) {
    return NextResponse.redirect(new URL('/inspection/new?payment=failed', req.url));
  }
}
