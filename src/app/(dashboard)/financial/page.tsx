// FILE: src/app/(dashboard)/financial/page.tsx
// STAGE: 10
// UPDATED: 2026-10-02
import * as React from 'react';
import { redirect } from 'next/navigation';
import { getAuthUser, requirePermission } from '@/lib/rbac';
import { getSyndicateRevenueSummary, getRevenueSeries, listDailyReports } from '@/actions/financial';
import { listStations } from '@/actions/stations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RevenueChart } from '@/components/financial/RevenueChart';
import { formatIQD, formatDate } from '@/lib/utils';
import { DollarSign, TrendingUp, ShieldCheck, FileCheck, Layers } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface FinancialPageProps {
  searchParams: { stationId?: string };
}

export default async function FinancialPage({ searchParams }: FinancialPageProps) {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  try {
    requirePermission(user, 'financial', 'read');
  } catch {
    redirect('/unauthorized');
  }

  const isSuperAdmin = user.role === 'SUPER_ADMIN';
  const selectedStationId = isSuperAdmin ? (searchParams.stationId ?? 'ALL') : user.stationId;

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const today = new Date().toISOString();

  const [summaryRes, seriesRes, reportsRes, stationsRes] = await Promise.all([
    getSyndicateRevenueSummary(thirtyDaysAgo, today),
    getRevenueSeries(selectedStationId, 30),
    listDailyReports({ stationId: selectedStationId && selectedStationId !== 'ALL' ? selectedStationId : undefined }),
    isSuperAdmin ? listStations() : Promise.resolve({ ok: true, data: [] }),
  ]);

  const summary = summaryRes.ok ? summaryRes.data : { totalInspections: 0, totalRevenueIqd: 0, syndicateShareIqd: 0, taxWithheldIqd: 0 };
  const revenueSeries = seriesRes.ok ? seriesRes.data : [];
  const reports = reportsRes.ok ? reportsRes.data : [];
  const stations = stationsRes.ok ? stationsRes.data : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Financial & Revenue Ledger</h1>
          <p className="text-sm text-muted-foreground">
            Syndicate fee distributions, 15% tax withholdings, and daily station reconciliation reports.
          </p>
        </div>

        {isSuperAdmin && stations.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground">Filter Station:</span>
            <div className="flex items-center gap-1 bg-muted p-1 rounded-lg text-xs">
              <a
                href="/financial"
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  selectedStationId === 'ALL' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                All Stations
              </a>
              {stations.map((s) => (
                <a
                  key={s.id}
                  href={`/financial?stationId=${s.id}`}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    selectedStationId === s.id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {s.name}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Revenue Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Total Revenue (30d)
            </CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
              {formatIQD(summary.totalRevenueIqd)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Collected from {summary.totalInspections} certified inspections
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Syndicate Share (20%)
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono tracking-tight text-primary">
              {formatIQD(summary.syndicateShareIqd)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Allocated syndicate operating reserve
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Tax Withheld (15%)
            </CardTitle>
            <ShieldCheck className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono tracking-tight text-blue-600 dark:text-blue-400">
              {formatIQD(summary.taxWithheldIqd)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Remitted to national treasury
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Total Inspections
            </CardTitle>
            <Layers className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
              {summary.totalInspections.toLocaleString()}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Completed check volume in 30 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <RevenueChart data={revenueSeries} />

      {/* Daily Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <FileCheck className="h-4 w-4 text-emerald-600" />
            Recent Daily Station Reconciliation Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">
              No reconciliation reports logged for this selection.
            </p>
          ) : (
            <div className="divide-y text-xs">
              {reports.map((r: any) => (
                <div key={r.id} className="flex items-center justify-between py-3">
                  <div>
                    <span className="font-semibold text-foreground">{r.station.name}</span>
                    <span className="text-muted-foreground ml-2">({formatDate(r.reportDate)})</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-muted-foreground">
                      {r.totalInspections} inspections
                    </span>
                    <span className="font-mono font-bold text-foreground">
                      {formatIQD(r.totalRevenueIqd)}
                    </span>
                    <Badge variant={r.reconciled ? 'default' : 'destructive'} className="text-[10px]">
                      {r.reconciled ? 'Reconciled' : 'Discrepancy'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
