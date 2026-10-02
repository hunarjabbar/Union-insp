// FILE: src/workers/payment-reconciler.ts
// STAGE: 12
// UPDATED: 2026-10-02

import { prisma } from '@/lib/prisma';
import { getPaymentProvider } from '@/lib/payments';
import { logger } from '@/lib/logger';
import { writeAudit } from '@/lib/audit';

export async function runReconciler() {
  const log = logger.child({ worker: 'payment-reconciler' });
  log.info('Starting daily payment reconciliation worker...');

  try {
    // 1. Refresh stale PENDING payments (older than 10 mins, less than 24 hours)
    const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const stalePayments = await prisma.payment.findMany({
      where: {
        status: { in: ['PENDING', 'PROCESSING'] },
        createdAt: { lte: tenMinsAgo, gte: oneDayAgo },
        gatewayRef: { not: null },
      },
    });

    log.info(`Refreshing status for ${stalePayments.length} stale payments...`);

    for (const payment of stalePayments) {
      try {
        const adapter = getPaymentProvider(payment.provider);
        const latest = await adapter.checkStatus(payment.gatewayRef!);
        if (latest !== payment.status) {
          await prisma.$transaction(async (tx) => {
            await tx.payment.update({
              where: { id: payment.id },
              data: {
                status: latest,
                completedAt: latest === 'COMPLETED' ? new Date() : undefined,
              },
            });

            if (latest === 'COMPLETED') {
              await tx.inspection.update({
                where: { id: payment.inspectionId },
                data: { paymentStatus: 'COLLECTED', paymentMethod: payment.provider },
              });

              await writeAudit({
                tx,
                userId: 'SYSTEM_RECONCILER',
                inspectionId: payment.inspectionId,
                action: 'PAYMENT_COMPLETED',
                entityType: 'Payment',
                entityId: payment.id,
                newValues: { provider: payment.provider, amountIqd: payment.amountIqd, source: 'reconciler' },
              });
            }
          });
          log.info(`Updated payment ${payment.id} status to ${latest}`);
        }
      } catch (err: any) {
        log.error(`Failed to refresh payment ${payment.id}: ${err.message}`);
      }
    }

    // 2. Expire 24h+ orphans
    const expiredResult = await prisma.payment.updateMany({
      where: {
        status: { in: ['PENDING', 'PROCESSING'] },
        createdAt: { lte: oneDayAgo },
      },
      data: {
        status: 'EXPIRED',
        failureReason: 'Transaction expired (over 24h old)',
      },
    });

    if (expiredResult.count > 0) {
      log.info(`Expired ${expiredResult.count} orphan payments older than 24h.`);
    }

    // 3. Match against DailyReport (daily financials variance check)
    // Find all DailyReports from the last 3 days to verify variance
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const reports = await prisma.dailyReport.findMany({
      where: {
        reportDate: { gte: threeDaysAgo },
      },
      include: {
        station: true,
      },
    });

    log.info(`Checking financial variance for ${reports.length} daily reports...`);

    const adminUser = await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' },
    });
    const raisedById = adminUser?.id;

    for (const report of reports) {
      const startOfDay = new Date(report.reportDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(report.reportDate);
      endOfDay.setHours(23, 59, 59, 999);

      // Sum actual completed payments on that day for that station
      const paymentsSum = await prisma.payment.aggregate({
        where: {
          inspection: { stationId: report.stationId },
          status: 'COMPLETED',
          completedAt: { gte: startOfDay, lte: endOfDay },
        },
        _sum: { amountIqd: true },
      });

      const actualRevenue = paymentsSum._sum.amountIqd || 0;
      const reportedRevenue = report.totalRevenueIqd;

      if (reportedRevenue > 0) {
        const variance = Math.abs(reportedRevenue - actualRevenue);
        const variancePct = (variance / reportedRevenue) * 100;

        if (variancePct > 5) {
          log.warn(
            `High financial variance detected at station ${report.stationId} on ${report.reportDate.toISOString().split('T')[0]}: reported ${reportedRevenue} IQD vs. actual ${actualRevenue} IQD (${variancePct.toFixed(2)}%)`
          );

          if (raisedById) {
            // Check if we already created an NCR for this station & date
            const ncrTitle = `Financial Variance Alert: ${report.station.name}`;
            const existingNcr = await prisma.nCR.findFirst({
              where: {
                stationId: report.stationId,
                title: ncrTitle,
              },
            });

            if (!existingNcr) {
              const ncrNumber = `NCR-REV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
              await prisma.nCR.create({
                data: {
                  ncrNumber,
                  stationId: report.stationId,
                  title: ncrTitle,
                  severity: 'HIGH',
                  raisedById,
                  description: `Automated audit: A financial variance of ${variancePct.toFixed(2)}% (${variance} IQD) was detected between reported drawer amount (${reportedRevenue} IQD) and bank gateway receipts (${actualRevenue} IQD) for date ${report.reportDate.toISOString().split('T')[0]}.`,
                  status: 'OPEN',
                  isoStandard: 'ISO_9001',
                },
              });
              log.info(`Created NCR ${ncrNumber} for financial variance.`);
            }
          }
        }
      }
    }

    log.info('Daily reconciliation finished successfully.');
  } catch (error: any) {
    log.error(`Reconciler process error: ${error.message}`);
  }
}
