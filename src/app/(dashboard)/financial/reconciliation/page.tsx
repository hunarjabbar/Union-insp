// FILE: src/app/(dashboard)/financial/reconciliation/page.tsx
// STAGE: 10
// UPDATED: 2026-10-02
import * as React from 'react';
import { redirect } from 'next/navigation';
import { getAuthUser, requirePermission } from '@/lib/rbac';
import { listStations } from '@/actions/stations';
import { listDailyReports } from '@/actions/financial';
import { DailyReconciliation } from '@/components/financial/DailyReconciliation';

export const dynamic = 'force-dynamic';

export default async function ReconciliationPage() {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  try {
    requirePermission(user, 'financial', 'reconcile');
  } catch {
    redirect('/unauthorized');
  }

  const [stationsRes, reportsRes] = await Promise.all([
    listStations(),
    listDailyReports({ stationId: user.role === 'SUPER_ADMIN' ? undefined : (user.stationId ?? undefined) }),
  ]);

  const stations = stationsRes.ok ? stationsRes.data : [];
  const reports = reportsRes.ok ? reportsRes.data : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Daily Financial Reconciliation</h1>
        <p className="text-sm text-muted-foreground">
          Reconcile physical cash drawer receipts with gateway electronic collections per station.
        </p>
      </div>

      <DailyReconciliation
        stations={stations}
        defaultStationId={user.stationId ?? undefined}
        recentReports={reports as any}
      />
    </div>
  );
}
