// FILE: src/actions/receipts.ts
// STAGE: 6
// UPDATED: 2026-10-01
'use server';

import { prisma } from '@/lib/prisma';
import { getAuthUser, requirePermission } from '@/lib/rbac';
import { writeAudit } from '@/lib/audit';
import { generateReceiptNumber } from '@/lib/utils';
import { generateInspectionQrDataUrl } from '@/lib/print/qr';
import {
  zReceiptCreate, zReceiptReprint,
} from '@/lib/validation/receipt.schema';
import type { ActionResult } from '@/types';
import type { Receipt } from '@prisma/client';

export async function createReceipt(raw: unknown): Promise<ActionResult<Receipt>> {
  const parsed = zReceiptCreate.safeParse(raw);
  if (!parsed.success) return { ok: false, error: 'Invalid input' };
  const user = await getAuthUser();
  if (!user) return { ok: false, error: 'Unauthorized' };
  try { requirePermission(user, 'receipt', 'create'); }
  catch { return { ok: false, error: 'Forbidden' }; }

  const { inspectionId, paymentId } = parsed.data;
  const inspection = await prisma.inspection.findUnique({ where: { id: inspectionId } });
  if (!inspection) return { ok: false, error: 'Inspection not found' };

  const baseUrl = process.env.PRINTER_QR_BASE_URL ?? 'http://localhost:3000/verify';
  const qrPayloadUrl = `${baseUrl}/${inspection.inspectionCode}`;
  const qrDataUrl = await generateInspectionQrDataUrl(qrPayloadUrl);

  const receipt = await prisma.$transaction(async (tx) => {
    const created = await tx.receipt.create({
      data: {
        inspectionId, paymentId,
        receiptNumber: generateReceiptNumber(),
        qrPayloadUrl, qrDataUrl,
      },
    });
    await writeAudit({ tx, userId: user.userId, inspectionId,
      action: 'RECEIPT_CREATED', entityType: 'Receipt', entityId: created.id,
      newValues: { receiptNumber: created.receiptNumber, qrPayloadUrl } });
    return created;
  });
  return { ok: true, data: receipt };
}

export async function markReceiptPrinted(
  receiptId: string, printerConfigId: string
): Promise<ActionResult<Receipt>> {
  const user = await getAuthUser();
  if (!user) return { ok: false, error: 'Unauthorized' };
  try { requirePermission(user, 'receipt', 'create'); }
  catch { return { ok: false, error: 'Forbidden' }; }

  const receipt = await prisma.$transaction(async (tx) => {
    const updated = await tx.receipt.update({
      where: { id: receiptId },
      data: { printedAt: new Date(), printedBy: user.userId, printerConfigId },
    });
    await writeAudit({ tx, userId: user.userId, action: 'RECEIPT_PRINTED',
      entityType: 'Receipt', entityId: receiptId,
      newValues: { printerConfigId } });
    return updated;
  });
  return { ok: true, data: receipt };
}

export async function reprintReceipt(raw: unknown): Promise<ActionResult<Receipt>> {
  const parsed = zReceiptReprint.safeParse(raw);
  if (!parsed.success) return { ok: false, error: 'Invalid input',
    fieldErrors: parsed.error.flatten().fieldErrors };
  const user = await getAuthUser();
  if (!user) return { ok: false, error: 'Unauthorized' };
  try { requirePermission(user, 'receipt', 'reprint'); }
  catch { return { ok: false, error: 'Forbidden' }; }

  const { receiptId, printerConfigId, reason } = parsed.data;
  const receipt = await prisma.$transaction(async (tx) => {
    const updated = await tx.receipt.update({
      where: { id: receiptId },
      data: {
        reprintCount: { increment: 1 },
        lastReprintedAt: new Date(), lastReprintedBy: user.userId,
        printerConfigId,
      },
    });
    await writeAudit({ tx, userId: user.userId, action: 'RECEIPT_REPRINTED',
      entityType: 'Receipt', entityId: receiptId,
      newValues: { reason, printerConfigId,
                   reprintCount: updated.reprintCount } });
    return updated;
  });
  return { ok: true, data: receipt };
}

export async function getReceiptPayload(receiptId: string) {
  const user = await getAuthUser();
  if (!user) return { ok: false as const, error: 'Unauthorized' };

  const receipt = await prisma.receipt.findUnique({
    where: { id: receiptId },
    include: {
      inspection: {
        include: {
          vehicle: true, station: true, lane: true,
          defects: true, payments: { where: { status: 'COMPLETED' }, take: 1 },
        },
      },
    },
  });
  if (!receipt) return { ok: false as const, error: 'Not found' };

  const insp = receipt.inspection;
  const payment = insp.payments[0];
  return { ok: true as const, data: {
    receiptNumber: receipt.receiptNumber,
    inspectionCode: insp.inspectionCode,
    plateNumber: insp.vehicle.plateNumber,
    category: insp.vehicle.category,
    stationName: insp.station.name,
    laneName: insp.lane.name,
    result: insp.overallResult ?? 'PENDING',
    defects: insp.defects.map(d => ({ type: d.type, description: d.description })),
    qrUrl: receipt.qrPayloadUrl,
    paidAmountIqd: payment?.amountIqd,
    paymentMethod: payment?.provider,
    issuedAt: receipt.createdAt,
    widthMm: 80 as const,
  } };
}

export async function getReceiptByInspection(inspectionId: string) {
  const receipt = await prisma.receipt.findFirst({
    where: { inspectionId }, orderBy: { createdAt: 'desc' },
  });
  return { ok: true as const, data: receipt };
}

export async function listReceipts(filter: { from?: string; to?: string } = {}) {
  const user = await getAuthUser();
  if (!user) return { ok: false as const, error: 'Unauthorized' };
  const where: Record<string, unknown> = {};
  if (filter.from || filter.to) {
    where.createdAt = {};
    if (filter.from) (where.createdAt as Record<string, unknown>).gte = new Date(filter.from);
    if (filter.to) (where.createdAt as Record<string, unknown>).lte = new Date(filter.to);
  }
  const receipts = await prisma.receipt.findMany({
    where, orderBy: { createdAt: 'desc' }, take: 200,
    include: { inspection: { select: { inspectionCode: true } } },
  });
  return { ok: true as const, data: receipts };
}
