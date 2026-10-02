// FILE: src/actions/payments.ts
// STAGE: 6
// UPDATED: 2026-10-01
'use server';

import { prisma } from '@/lib/prisma';
import { getAuthUser, requirePermission, requireRole } from '@/lib/rbac';
import { writeAudit } from '@/lib/audit';
import { getPaymentProvider } from '@/lib/payments';
import {
  zPaymentInitiate, zCashPayment,
} from '@/lib/validation/payment.schema';
import type { ActionResult } from '@/types';
import type { Payment } from '@prisma/client';

export async function initiatePayment(
  raw: unknown
): Promise<ActionResult<{ paymentId: string; qrData?: string; deepLink?: string }>> {
  const parsed = zPaymentInitiate.safeParse(raw);
  if (!parsed.success) return { ok: false, error: 'Invalid input' };
  const user = await getAuthUser();
  if (!user) return { ok: false, error: 'Unauthorized' };
  try { requirePermission(user, 'payment', 'create'); }
  catch { return { ok: false, error: 'Forbidden' }; }

  const { inspectionId, provider, customerPhone } = parsed.data;
  const inspection = await prisma.inspection.findUnique({ where: { id: inspectionId } });
  if (!inspection) return { ok: false, error: 'Inspection not found' };

  const idempotencyKey = `${inspectionId}:${provider}:${Date.now()}`;
  const adapter = getPaymentProvider(provider);

  const result = await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.create({
      data: {
        inspectionId, provider, amountIqd: inspection.feeAmountIqd,
        status: 'PENDING', idempotencyKey, customerPhone,
      },
    });
    const gateway = await adapter.initiate({
      amountIqd: inspection.feeAmountIqd,
      inspectionCode: inspection.inspectionCode,
      idempotencyKey, customerPhone,
    });
    const updated = await tx.payment.update({
      where: { id: payment.id },
      data: {
        gatewayRef: gateway.gatewayRef,
        gatewayQrData: gateway.qrData,
        gatewayDeepLink: gateway.deepLink,
      },
    });
    await writeAudit({ tx, userId: user.userId, inspectionId,
      action: 'PAYMENT_INITIATED', entityType: 'Payment', entityId: payment.id,
      newValues: { provider, amountIqd: inspection.feeAmountIqd, gatewayRef: gateway.gatewayRef } });
    return updated;
  });

  return { ok: true, data: {
    paymentId: result.id,
    qrData: result.gatewayQrData ?? undefined,
    deepLink: result.gatewayDeepLink ?? undefined,
  } };
}

export async function confirmCashPayment(raw: unknown): Promise<ActionResult<Payment>> {
  const parsed = zCashPayment.safeParse(raw);
  if (!parsed.success) return { ok: false, error: 'Invalid input' };
  const user = await getAuthUser();
  if (!user) return { ok: false, error: 'Unauthorized' };
  try { requirePermission(user, 'payment', 'create'); }
  catch { return { ok: false, error: 'Forbidden' }; }

  const { inspectionId, amountIqd } = parsed.data;
  const idempotencyKey = `${inspectionId}:CASH:${Date.now()}`;

  const payment = await prisma.$transaction(async (tx) => {
    const created = await tx.payment.create({
      data: {
        inspectionId, provider: 'CASH', amountIqd, status: 'COMPLETED',
        idempotencyKey, completedAt: new Date(),
      },
    });
    await tx.inspection.update({
      where: { id: inspectionId },
      data: { paymentStatus: 'COLLECTED', paymentMethod: 'CASH' },
    });
    await writeAudit({ tx, userId: user.userId, inspectionId,
      action: 'PAYMENT_CASH_COLLECTED', entityType: 'Payment',
      entityId: created.id, newValues: { amountIqd } });
    return created;
  });

  return { ok: true, data: payment };
}

export async function getPaymentStatus(paymentId: string) {
  const user = await getAuthUser();
  if (!user) return { ok: false as const, error: 'Unauthorized' };

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { inspection: true },
  });
  if (!payment) return { ok: false as const, error: 'Not found' };

  if ((payment.status === 'PENDING' || payment.status === 'PROCESSING') && payment.gatewayRef) {
    const adapter = getPaymentProvider(payment.provider);
    const latest = await adapter.checkStatus(payment.gatewayRef);

    if (latest !== payment.status) {
      const result = await prisma.$transaction(async (tx) => {
        const updatedPayment = await tx.payment.update({
          where: { id: paymentId },
          data: {
            status: latest,
            completedAt: latest === 'COMPLETED' ? new Date() : undefined,
            failureReason: latest === 'FAILED' ? 'Gateway reported failure' : undefined,
          },
        });

        if (latest === 'COMPLETED') {
          await tx.inspection.update({
            where: { id: payment.inspectionId },
            data: {
              paymentStatus: 'COLLECTED',
              paymentMethod: payment.provider,
            },
          });

          await writeAudit({
            tx,
            userId: user.userId,
            inspectionId: payment.inspectionId,
            action: 'PAYMENT_COMPLETED',
            entityType: 'Payment',
            entityId: paymentId,
            newValues: {
              provider: payment.provider,
              amountIqd: payment.amountIqd,
              gatewayRef: payment.gatewayRef,
              source: 'polling',
            },
          });
        } else if (latest === 'FAILED') {
          await writeAudit({
            tx,
            userId: user.userId,
            inspectionId: payment.inspectionId,
            action: 'PAYMENT_FAILED',
            entityType: 'Payment',
            entityId: paymentId,
            newValues: {
              provider: payment.provider,
              gatewayRef: payment.gatewayRef,
              source: 'polling',
            },
          });
        }

        return updatedPayment;
      });

      return {
        ok: true as const,
        data: {
          status: result.status,
          completedAt: result.completedAt,
          failureReason: result.failureReason,
        },
      };
    }
  }

  return {
    ok: true as const,
    data: {
      status: payment.status,
      completedAt: payment.completedAt,
      failureReason: payment.failureReason,
    },
  };
}

export async function refundPayment(
  paymentId: string, amountIqd: number, reason: string
): Promise<ActionResult<Payment>> {
  const user = await getAuthUser();
  if (!user) return { ok: false, error: 'Unauthorized' };
  try { requireRole(user, ['SUPER_ADMIN']); }
  catch { return { ok: false, error: 'Forbidden' }; }

  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment || !payment.gatewayRef) return { ok: false, error: 'Not found' };

  const adapter = getPaymentProvider(payment.provider);
  const ok = await adapter.refund(payment.gatewayRef, amountIqd);
  if (!ok) return { ok: false, error: 'Gateway refund failed' };

  const updated = await prisma.$transaction(async (tx) => {
    const u = await tx.payment.update({
      where: { id: paymentId },
      data: { status: 'REFUNDED', refundedAt: new Date(), refundAmountIqd: amountIqd },
    });
    await writeAudit({ tx, userId: user.userId, action: 'PAYMENT_REFUNDED',
      entityType: 'Payment', entityId: paymentId,
      newValues: { amountIqd, reason } });
    return u;
  });
  return { ok: true, data: updated };
}

export async function listPayments(filter: {
  provider?: string; status?: string; from?: string; to?: string;
} = {}) {
  const user = await getAuthUser();
  if (!user) return { ok: false as const, error: 'Unauthorized' };
  const where: Record<string, unknown> = {};
  if (filter.provider) where.provider = filter.provider;
  if (filter.status) where.status = filter.status;
  if (filter.from || filter.to) {
    where.createdAt = {};
    if (filter.from) (where.createdAt as Record<string, unknown>).gte = new Date(filter.from);
    if (filter.to) (where.createdAt as Record<string, unknown>).lte = new Date(filter.to);
  }
  const payments = await prisma.payment.findMany({
    where, orderBy: { createdAt: 'desc' }, take: 200,
    include: { inspection: { select: { inspectionCode: true, vehicle: { select: { plateNumber: true } } } } },
  });
  return { ok: true as const, data: payments };
}
