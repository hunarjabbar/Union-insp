// FILE: src/app/api/payments/fastpay/return/route.ts
// STAGE: 12
// UPDATED: 2026-10-02

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPaymentProvider } from '@/lib/payments';
import { writeAudit } from '@/lib/audit';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const orderId = searchParams.get('order_id') || searchParams.get('idempotencyKey');
  const transactionId = searchParams.get('transaction_id') || searchParams.get('gatewayRef');

  if (!orderId && !transactionId) {
    return NextResponse.redirect(new URL('/inspection/new?payment=failed', req.url));
  }

  try {
    const payment = await prisma.payment.findFirst({
      where: {
        OR: [
          transactionId ? { gatewayRef: transactionId } : undefined,
          orderId ? { idempotencyKey: orderId } : undefined,
        ].filter(Boolean) as any,
      },
      include: { inspection: true },
    });

    if (!payment) {
      return NextResponse.redirect(new URL('/inspection/new?payment=failed', req.url));
    }

    const adapter = getPaymentProvider('FASTPAY');
    const latestStatus = await adapter.checkStatus(payment.gatewayRef || transactionId || '');

    if (latestStatus === 'COMPLETED' && payment.status !== 'COMPLETED') {
      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: payment.id },
          data: { status: 'COMPLETED', completedAt: new Date() },
        });
        await tx.inspection.update({
          where: { id: payment.inspectionId },
          data: { paymentStatus: 'COLLECTED', paymentMethod: 'FASTPAY' },
        });
        await writeAudit({
          tx,
          userId: payment.inspection.inspectorId || 'SYSTEM',
          inspectionId: payment.inspectionId,
          action: 'PAYMENT_COMPLETED',
          entityType: 'Payment',
          entityId: payment.id,
          newValues: { provider: 'FASTPAY', amountIqd: payment.amountIqd, source: 'fastpay_return' },
        });
      });
    }

    return NextResponse.redirect(new URL(`/inspection/new?payment=success&inspectionId=${payment?.inspectionId || ''}`, req.url));
  } catch {
    return NextResponse.redirect(new URL('/inspection/new?payment=failed', req.url));
  }
}
