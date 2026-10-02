// FILE: src/actions/financial.ts
// STAGE: 6
// UPDATED: 2026-10-01
'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthUser, requirePermission, requireRole } from '@/lib/rbac';
import { writeAudit } from '@/lib/audit';
import type { ActionResult } from '@/types';
import type { DailyReport } from '@prisma/client';

const zReconcile = z.object({
  stationId: z.string(),
  date: z.string(),
  cashIqd: z.number().int().min(0),
  electronicIqd: z.number().int().min(0),
});

export async function reconcileDaily(raw: unknown): Promise<ActionResult<DailyReport>> {
  const parsed = zReconcile.safeParse(raw);
  if (!parsed.success) return { ok: false, error: 'Invalid input' };
  const user = await getAuthUser();
  if (!user) return { ok: false, error: 'Unauthorized' };
  try { requirePermission(user, 'financial', 'reconcile'); }
  catch { return { ok: false, error: 'Forbidden' }; }

  const { stationId, date, cashIqd, electronicIqd } = parsed.data;
  const reportDate = new Date(date);

  const report = await prisma.$transaction(async (tx) => {
    const totalRevenue = cashIqd + electronicIqd;
    const expected = await tx.inspection.count({
      where: {
        stationId,
        paymentStatus: 'COLLECTED',
        createdAt: {
          gte: new Date(new Date(date).setHours(0, 0, 0, 0)),
          lte: new Date(new Date(date).setHours(23, 59, 59, 999)),
        },
      },
    });
    const expectedIqd = expected * 30000;
    const notes = totalRevenue !== expectedIqd
      ? `Variance: expected ${expectedIqd}, got ${totalRevenue}`
      : null;

    const upserted = await tx.dailyReport.upsert({
      where: { stationId_reportDate: { stationId, reportDate } },
      update: {
        cashCollectedIqd: cashIqd, electronicCollectedIqd: electronicIqd,
        totalRevenueIqd: totalRevenue, totalInspections: expected,
        reconciled: true, reconciledBy: user.userId,
        reconciledAt: new Date(), notes,
      },
      create: {
        stationId, reportDate,
        cashCollectedIqd: cashIqd, electronicCollectedIqd: electronicIqd,
        totalRevenueIqd: totalRevenue, totalInspections: expected,
        reconciled: true, reconciledBy: user.userId,
        reconciledAt: new Date(), notes,
      },
    });
    await writeAudit({ tx, userId: user.userId, action: 'DAILY_RECONCILED',
      entityType: 'DailyReport', entityId: upserted.id,
      newValues: { cashIqd, electronicIqd, totalRevenue, expectedIqd, notes } });
    return upserted;
  });
  return { ok: true, data: report };
}

export async function listDailyReports(filter: {
  stationId?: string; from?: string; to?: string;
} = {}) {
  const where: Record<string, unknown> = {};
  if (filter.stationId) where.stationId = filter.stationId;
  if (filter.from || filter.to) {
    where.reportDate = {};
    if (filter.from) (where.reportDate as Record<string, unknown>).gte = new Date(filter.from);
    if (filter.to) (where.reportDate as Record<string, unknown>).lte = new Date(filter.to);
  }
  const reports = await prisma.dailyReport.findMany({
    where, orderBy: { reportDate: 'desc' },
    include: { station: { select: { name: true } } },
  });
  return { ok: true as const, data: reports };
}

export async function getSyndicateRevenueSummary(from: string, to: string) {
  const fromD = new Date(from); const toD = new Date(to);
  const [totalInspections, totalRevenueAgg] = await Promise.all([
    prisma.inspection.count({
      where: { createdAt: { gte: fromD, lte: toD },
               status: { in: ['PASSED','CONDITIONAL_PASS','FAILED'] } },
    }),
    prisma.inspection.aggregate({
      where: { createdAt: { gte: fromD, lte: toD },
               paymentStatus: 'COLLECTED' },
      _sum: { feeAmountIqd: true },
    }),
  ]);
  const totalRevenueIqd = totalRevenueAgg._sum.feeAmountIqd ?? 0;
  const grossProfit = totalRevenueIqd * 0.85;
  const syndicateShareIqd = Math.round(grossProfit * 0.20);
  const taxWithheldIqd = Math.round(totalRevenueIqd * 0.15);
  return { ok: true as const, data: {
    totalInspections, totalRevenueIqd, syndicateShareIqd, taxWithheldIqd,
  } };
}

export async function generateSyndicateSummary(from: string, to: string) {
  const user = await getAuthUser();
  if (!user) return { ok: false as const, error: 'Unauthorized' };
  try { requireRole(user, ['SUPER_ADMIN', 'SYNDICATE_REPRESENTATIVE']); }
  catch { return { ok: false as const, error: 'Forbidden' }; }

  const fromD = new Date(from); const toD = new Date(to);
  const inspections = await prisma.inspection.findMany({
    where: { createdAt: { gte: fromD, lte: toD },
             status: { in: ['PASSED','CONDITIONAL_PASS','FAILED'] } },
    include: { station: true, vehicle: { include: { fleetOwner: true } } },
  });

  const byStation = new Map<string, { name: string; count: number; revenue: number }>();
  const byFleet = new Map<string, { name: string; vehicleSet: Set<string>;
    passCount: number; total: number }>();

  for (const i of inspections) {
    const s = byStation.get(i.stationId) ?? { name: i.station.name, count: 0, revenue: 0 };
    s.count += 1; s.revenue += i.feeAmountIqd;
    byStation.set(i.stationId, s);

    const fleet = i.vehicle.fleetOwner;
    if (fleet) {
      const f = byFleet.get(fleet.id) ?? { name: fleet.companyName,
        vehicleSet: new Set<string>(), passCount: 0, total: 0 };
      f.vehicleSet.add(i.vehicleId);
      f.total += 1;
      if (i.status === 'PASSED') f.passCount += 1;
      byFleet.set(fleet.id, f);
    }
  }

  const totalRevenueIqd = inspections.reduce((s, i) => s + i.feeAmountIqd, 0);
  const taxWithheldIqd = Math.round(totalRevenueIqd * 0.15);
  const syndicateShareIqd = Math.round(totalRevenueIqd * 0.85 * 0.20);

  return { ok: true as const, data: {
    totalInspections: inspections.length,
    totalRevenueIqd, syndicateShareIqd, taxWithheldIqd,
    byStation: Array.from(byStation.entries()).map(([id, v]) => ({ stationId: id, ...v })),
    byFleet: Array.from(byFleet.entries()).map(([id, v]) => ({
      fleetId: id, name: v.name, vehicleCount: v.vehicleSet.size,
      passRate: v.total > 0 ? Math.round((v.passCount / v.total) * 100) : 0,
    })),
  } };
}

export async function getRevenueSeries(stationId?: string | null, days = 30) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const where: Record<string, unknown> = {
    createdAt: { gte: cutoff },
    paymentStatus: 'COLLECTED',
  };
  if (stationId && stationId !== 'ALL') where.stationId = stationId;

  const inspections = await prisma.inspection.findMany({
    where,
    select: { createdAt: true, feeAmountIqd: true },
    orderBy: { createdAt: 'asc' },
  });

  const map = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    map.set(key, 0);
  }

  for (const ins of inspections) {
    const key = new Date(ins.createdAt).toISOString().split('T')[0];
    const cur = map.get(key) ?? 0;
    map.set(key, cur + ins.feeAmountIqd);
  }

  const data = Array.from(map.entries()).map(([day, totalIqd]) => ({
    day,
    totalIqd,
  }));

  return { ok: true as const, data };
}

