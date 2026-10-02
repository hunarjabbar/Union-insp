// FILE: src/app/(dashboard)/inspection/page.tsx
// STAGE: 8
// UPDATED: 2026-10-02
import { redirect } from 'next/navigation';
import { getAuthUser, requirePermission } from '@/lib/rbac';
import { listInspections } from '@/actions/inspections';
import { getThroughputSeries, getDefectDistribution, getPassRate }
  from '@/lib/iso/metrics';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { InspectionStats } from '@/components/inspection/InspectionStats';
import { ThroughputChart } from '@/components/inspection/ThroughputChart';
import { DefectDistribution } from '@/components/inspection/DefectDistribution';
import { InspectionTable } from '@/components/inspection/InspectionTable';

export const dynamic = 'force-dynamic';

export default async function InspectionDashboardPage() {
  const user = await getAuthUser();
  if (!user) redirect('/login');
  try { requirePermission(user, 'inspection', 'read'); }
  catch { redirect('/unauthorized'); }

  const startOfDay = new Date(); startOfDay.setHours(0,0,0,0);

  const [todayAgg, todayRevenue, recent, throughput, defectDist, passRate] =
    await Promise.all([
      prisma.inspection.count({
        where: { createdAt: { gte: startOfDay },
                 stationId: user.stationId ?? undefined },
      }),
      prisma.inspection.aggregate({
        where: { createdAt: { gte: startOfDay },
                 paymentStatus: 'COLLECTED',
                 stationId: user.stationId ?? undefined },
        _sum: { feeAmountIqd: true },
      }),
      listInspections({ stationId: user.stationId, page: 1, pageSize: 20 }),
      getThroughputSeries(user.stationId, 7),
      getDefectDistribution(user.stationId, 30),
      getPassRate(user.stationId, 30),
    ]);

  const canCreate = ['SUPER_ADMIN','STATION_MANAGER','LEAD_INSPECTOR',
                     'INSPECTION_TECHNICIAN'].includes(user.role);
  const rows = recent.ok ? recent.data.rows : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inspection Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('en-GB', {
              weekday: 'long', year: 'numeric',
              month: 'long', day: 'numeric',
            })}
          </p>
        </div>
        {canCreate && (
          <Button asChild>
            <Link href="/inspection/new">New Inspection</Link>
          </Button>
        )}
      </div>

      <InspectionStats
        todayCount={todayAgg}
        todayRevenueIqd={todayRevenue._sum.feeAmountIqd ?? 0}
        passRate={passRate}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ThroughputChart data={throughput} />
        <DefectDistribution data={defectDist} />
      </div>

      <InspectionTable rows={rows} />
    </div>
  );
}
