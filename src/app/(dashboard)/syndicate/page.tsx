// FILE: src/app/(dashboard)/syndicate/page.tsx
// STAGE: 11
// UPDATED: 2026-10-02
import * as React from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getAuthUser, requireRole } from '@/lib/rbac';
import { getSyndicateRevenueSummary } from '@/actions/financial';
import { prisma } from '@/lib/prisma';
import { SyndicateRevenueCard } from '@/components/syndicate/SyndicateRevenueCard';
import { ComplianceByStationChart } from '@/components/syndicate/ComplianceByStationChart';
import { FleetRiskTable } from '@/components/syndicate/FleetRiskTable';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function SyndicatePage() {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  try {
    requireRole(user, ['SUPER_ADMIN', 'SYNDICATE_REPRESENTATIVE']);
  } catch {
    redirect('/unauthorized');
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const today = new Date().toISOString();
  const sinceDate = new Date(thirtyDaysAgo);

  const [summaryRes, stationsWithInspections, fleetRows] = await Promise.all([
    getSyndicateRevenueSummary(thirtyDaysAgo, today),
    prisma.station.findMany({
      include: {
        inspections: {
          where: { createdAt: { gte: sinceDate } },
          select: { status: true },
        },
      },
    }),
    prisma.fleetOwner.findMany({
      include: {
        vehicles: {
          include: {
            inspections: {
              include: {
                defects: { select: { type: true } },
              },
            },
          },
        },
      },
      take: 50,
    }),
  ]);

  const summary = summaryRes.ok
    ? summaryRes.data
    : { totalRevenueIqd: 0, syndicateShareIqd: 0, taxWithheldIqd: 0, totalInspections: 0 };

  const complianceByStation = stationsWithInspections.map((st) => {
    const total = st.inspections.length;
    const passed = st.inspections.filter((i) => i.status === 'PASSED').length;
    const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;
    return {
      stationName: st.name,
      passRate,
      total,
    };
  });

  const fleetRiskUnsorted = fleetRows.map((fleet) => {
    let vehicleCount = fleet.vehicles.length;
    let totalInspections = 0;
    let passedCount = 0;
    let criticalDefects = 0;

    for (const v of fleet.vehicles) {
      for (const ins of v.inspections) {
        totalInspections += 1;
        if (ins.status === 'PASSED') passedCount += 1;
        for (const def of ins.defects) {
          if (def.type === 'CRITICAL') criticalDefects += 1;
        }
      }
    }

    const passRate = totalInspections > 0 ? Math.round((passedCount / totalInspections) * 100) : 100;
    return {
      fleetId: fleet.id,
      companyName: fleet.companyName,
      vehicleCount,
      passRate,
      criticalDefects,
    };
  });

  const fleetRisk = fleetRiskUnsorted
    .sort((a, b) => b.criticalDefects - a.criticalDefects || a.passRate - b.passRate)
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Syndicate Oversight Portal</h1>
          <p className="text-sm text-muted-foreground">
            Regional safety analytics, commercial fleet risk indexes, and revenue distribution monitoring.
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/syndicate/reports">
            <FileSpreadsheet className="h-4 w-4" /> Comprehensive Reports & CSV Export
          </Link>
        </Button>
      </div>

      <SyndicateRevenueCard summary={summary} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ComplianceByStationChart data={complianceByStation} />
        <FleetRiskTable rows={fleetRisk} />
      </div>
    </div>
  );
}
