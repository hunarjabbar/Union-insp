// FILE: src/app/api/payments/webhooks/fastpay/route.ts
// STAGE: 12
// UPDATED: 2026-10-02

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPaymentProvider } from '@/lib/payments';
import { writeAudit } from '@/lib/audit';

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const headersObj: Record<string, string> = {};
  req.headers.forEach((value, name) => {
    headersObj[name.toLowerCase()] = value;
  });

  const adapter = getPaymentProvider('FASTPAY');
  if (!adapter.verifyWebhookSignature(rawBody, headersObj)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let payload: any = {};
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const gatewayRef = payload.transaction_id;
  const orderId = payload.order_id;

  const payment = await prisma.payment.findFirst({
    where: {
      OR: [
        gatewayRef ? { gatewayRef } : undefined,
        orderId ? { idempotencyKey: orderId } : undefined,
      ].filter(Boolean) as any,
    },
    include: { inspection: true },
  });

  if (!payment) {
    return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
  }

  if (payment.status === 'COMPLETED') {
    return NextResponse.json({ idempotent: true, status: 'COMPLETED' });
  }

  const latestStatus = await adapter.checkStatus(payment.gatewayRef || gatewayRef || '');

  if (latestStatus === 'COMPLETED') {
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
        newValues: { provider: 'FASTPAY', amountIqd: payment.amountIqd, gatewayRef, source: 'fastpay_webhook' },
      });
    });
  }

  return NextResponse.json({ success: true, status: latestStatus });
}
