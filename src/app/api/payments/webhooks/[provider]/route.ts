// FILE: src/app/api/payments/webhooks/[provider]/route.ts
// STAGE: 12
// UPDATED: 2026-10-02

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPaymentProvider } from '@/lib/payments';
import { writeAudit } from '@/lib/audit';

export async function POST(
  req: NextRequest,
  { params }: { params: { provider: string } }
) {
  const providerParam = params.provider.toUpperCase();
  const rawBody = await req.text();

  // Parse headers to generic record
  const headersObj: Record<string, string> = {};
  req.headers.forEach((value, name) => {
    headersObj[name.toLowerCase()] = value;
  });

  try {
    const adapter = getPaymentProvider(providerParam as any);
    if (!adapter) {
      return NextResponse.json({ error: 'Unknown provider' }, { status: 400 });
    }

    // Verify webhook signature
    const isValid = adapter.verifyWebhookSignature(rawBody, headersObj);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Parse payload
    let payload: any = {};
    try {
      payload = JSON.parse(rawBody);
    } catch {
      // Body may not be JSON for some gateways
    }

    // Extract identifiers depending on provider formats
    let gatewayRef = payload.transaction_id || payload.token || payload.paymentId || payload.id;
    let orderId = payload.order_id || payload.orderId;
    let gatewayStatus = payload.status;

    // Search for the payment record
    const payment = await prisma.payment.findFirst({
      where: {
        OR: [
          gatewayRef ? { gatewayRef } : undefined,
          orderId ? { idempotencyKey: orderId } : undefined,
        ].filter(Boolean) as any,
      },
      include: {
        inspection: true,
      },
    });

    if (!payment) {
      return NextResponse.json({ error: 'Payment record not found' }, { status: 404 });
    }

    // Handle idempotency
    if (payment.status === 'COMPLETED') {
      return NextResponse.json({ idempotent: true, status: 'COMPLETED' });
    }
    if (payment.status === 'REFUNDED') {
      return NextResponse.json({ idempotent: true, status: 'REFUNDED' });
    }

    // Secondary verification: query the gateway itself to be authoritative
    const latestStatus = await adapter.checkStatus(payment.gatewayRef || gatewayRef || payment.idempotencyKey);

    if (latestStatus === 'COMPLETED') {
      await prisma.$transaction(async (tx) => {
        // Update payment
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
          },
        });

        // Update inspection
        await tx.inspection.update({
          where: { id: payment.inspectionId },
          data: {
            paymentStatus: 'COLLECTED',
            paymentMethod: payment.provider,
          },
        });

        // Record audit log
        await writeAudit({
          tx,
          userId: payment.inspection.inspectorId || 'SYSTEM',
          inspectionId: payment.inspectionId,
          action: 'PAYMENT_COMPLETED',
          entityType: 'Payment',
          entityId: payment.id,
          newValues: {
            provider: payment.provider,
            amountIqd: payment.amountIqd,
            gatewayRef: payment.gatewayRef,
            source: 'webhook',
          },
        });
      });

      return NextResponse.json({ status: 'COMPLETED', completed: true });
    } else if (latestStatus === 'FAILED') {
      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: 'FAILED',
            failureReason: 'Gateway marked as failed',
          },
        });

        await writeAudit({
          tx,
          userId: payment.inspection.inspectorId || 'SYSTEM',
          inspectionId: payment.inspectionId,
          action: 'PAYMENT_FAILED',
          entityType: 'Payment',
          entityId: payment.id,
          newValues: {
            provider: payment.provider,
            gatewayRef: payment.gatewayRef,
            source: 'webhook',
          },
        });
      });

      return NextResponse.json({ status: 'failed', completed: false });
    }

    return NextResponse.json({ status: 'processing', completed: false });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { provider: string } }
) {
  // Support redirect callbacks (GET returns)
  const providerParam = params.provider.toUpperCase();
  const searchParams = req.nextUrl.searchParams;

  const token = searchParams.get('token') || searchParams.get('id') || searchParams.get('orderId');

  if (!token) {
    return NextResponse.redirect(new URL('/unauthorized', req.url));
  }

  try {
    const adapter = getPaymentProvider(providerParam as any);

    // Look up the payment by gatewayRef or idempotencyKey
    const payment = await prisma.payment.findFirst({
      where: {
        OR: [
          { gatewayRef: token },
          { idempotencyKey: token },
        ],
      },
      include: {
        inspection: true,
      },
    });

    if (!payment) {
      return NextResponse.redirect(new URL('/inspection', req.url));
    }

    // Authoritative check with provider
    const latestStatus = await adapter.checkStatus(payment.gatewayRef || token);

    if (latestStatus === 'COMPLETED' && payment.status !== 'COMPLETED') {
      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
          },
        });

        await tx.inspection.update({
          where: { id: payment.inspectionId },
          data: {
            paymentStatus: 'COLLECTED',
            paymentMethod: payment.provider,
          },
        });

        await writeAudit({
          tx,
          userId: payment.inspection.inspectorId || 'SYSTEM',
          inspectionId: payment.inspectionId,
          action: 'PAYMENT_COMPLETED',
          entityType: 'Payment',
          entityId: payment.id,
          newValues: {
            provider: payment.provider,
            amountIqd: payment.amountIqd,
            gatewayRef: payment.gatewayRef,
            source: 'redirect',
          },
        });
      });
    }

    // Redirect user back to the inspection wizard details page
    return NextResponse.redirect(
      new URL(`/inspection/new?success=true&inspectionId=${payment.inspectionId}`, req.url)
    );
  } catch (error) {
    console.error('Redirect handler error:', error);
    return NextResponse.redirect(new URL('/inspection', req.url));
  }
}
