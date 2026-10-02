// FILE: src/app/api/payments/fib/callback/route.ts
// STAGE: 12
// UPDATED: 2026-10-02

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPaymentProvider } from '@/lib/payments';
import { writeAudit } from '@/lib/audit';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const paymentId = searchParams.get('paymentId') || searchParams.get('id');

  if (!paymentId) {
    return NextResponse.redirect(new URL('/inspection/new?payment=failed', req.url));
  }

  try {
    const payment = await prisma.payment.findFirst({
      where: {
        OR: [
          { gatewayRef: paymentId },
          { id: paymentId },
        ],
      },
      include: { inspection: true },
    });

    if (!payment) {
      return NextResponse.redirect(new URL('/inspection/new?payment=failed', req.url));
    }

    const adapter = getPaymentProvider('FIB');
    const latestStatus = await adapter.checkStatus(payment.gatewayRef || paymentId);

    if (latestStatus === 'COMPLETED' && payment.status !== 'COMPLETED') {
      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: payment.id },
          data: { status: 'COMPLETED', completedAt: new Date() },
        });
        await tx.inspection.update({
          where: { id: payment.inspectionId },
          data: { paymentStatus: 'COLLECTED', paymentMethod: 'FIB' },
        });
        await writeAudit({
          tx,
          userId: payment.inspection.inspectorId || 'SYSTEM',
          inspectionId: payment.inspectionId,
          action: 'PAYMENT_COMPLETED',
          entityType: 'Payment',
          entityId: payment.id,
          newValues: { provider: 'FIB', amountIqd: payment.amountIqd, source: 'fib_callback_return' },
        });
      });
    }

    return NextResponse.redirect(new URL(`/inspection/new?payment=success&inspectionId=${payment.inspectionId}`, req.url));
  } catch {
    return NextResponse.redirect(new URL('/inspection/new?payment=failed', req.url));
  }
}
