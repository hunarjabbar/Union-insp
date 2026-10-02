// FILE: src/app/(dashboard)/syndicate/reports/page.tsx
// STAGE: 11
// UPDATED: 2026-10-02
import * as React from 'react';
import { redirect } from 'next/navigation';
import { getAuthUser, requireRole } from '@/lib/rbac';
import { generateSyndicateSummary } from '@/actions/financial';
import { ReportDateRangePicker } from '@/components/syndicate/ReportDateRangePicker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatIQD } from '@/lib/utils';
import { Building2, Truck } from 'lucide-react';

export const dynamic = 'force-dynamic';

function getDefaultFrom(): string {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().split('T')[0];
}

function getDefaultTo(): string {
  return new Date().toISOString().split('T')[0];
}

interface ReportsPageProps {
  searchParams: { from?: string; to?: string };
}

export default async function SyndicateReportsPage({ searchParams }: ReportsPageProps) {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  try {
    requireRole(user, ['SUPER_ADMIN', 'SYNDICATE_REPRESENTATIVE']);
  } catch {
    redirect('/unauthorized');
  }

  const from = searchParams.from ?? getDefaultFrom();
  const to = searchParams.to ?? getDefaultTo();

  const summaryRes = await generateSyndicateSummary(from, to);
  const data = summaryRes.ok
    ? summaryRes.data
    : { totalInspections: 0, totalRevenueIqd: 0, syndicateShareIqd: 0, taxWithheldIqd: 0, byStation: [], byFleet: [] };

  const csvHeaders = ['Entity Type', 'Name / ID', 'Inspections Count', 'Revenue (IQD)', 'Pass Rate (%)'];
  const csvRows: (string | number)[][] = [];

  for (const st of data.byStation) {
    csvRows.push(['Station', st.name, st.count, st.revenue, '—']);
  }
  for (const f of data.byFleet) {
    csvRows.push(['Fleet Operator', f.name, f.vehicleCount, '—', `${f.passRate}%`]);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Syndicate Compliance & Financial Reports</h1>
        <p className="text-sm text-muted-foreground">
          Detailed inspection performance aggregated by station and commercial fleet operators.
        </p>
      </div>

      <ReportDateRangePicker from={from} to={to} csvData={{ headers: csvHeaders, rows: csvRows }} />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase">Period Inspections</p>
          <p className="text-2xl font-bold font-mono mt-1">{data.totalInspections.toLocaleString()}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase">Total Revenue</p>
          <p className="text-2xl font-bold font-mono mt-1 text-emerald-600">{formatIQD(data.totalRevenueIqd)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase">Syndicate Share (20%)</p>
          <p className="text-2xl font-bold font-mono mt-1 text-primary">{formatIQD(data.syndicateShareIqd)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase">Tax Withheld (15%)</p>
          <p className="text-2xl font-bold font-mono mt-1 text-blue-600">{formatIQD(data.taxWithheldIqd)}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              Performance by Station
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.byStation.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">No records for this date range.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b text-muted-foreground font-semibold">
                      <th className="pb-2.5">Station Name</th>
                      <th className="pb-2.5 text-center">Inspections</th>
                      <th className="pb-2.5 text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.byStation.map((st: any) => (
                      <tr key={st.stationId} className="hover:bg-muted/50">
                        <td className="py-2.5 font-semibold text-foreground">{st.name}</td>
                        <td className="py-2.5 text-center font-mono">{st.count}</td>
                        <td className="py-2.5 text-right font-mono font-bold">{formatIQD(st.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Truck className="h-4 w-4 text-amber-600" />
              Fleet Operator Compliance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.byFleet.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">No records for this date range.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b text-muted-foreground font-semibold">
                      <th className="pb-2.5">Fleet Name</th>
                      <th className="pb-2.5 text-center">Vehicles</th>
                      <th className="pb-2.5 text-right">Pass Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.byFleet.map((f: any) => (
                      <tr key={f.fleetId} className="hover:bg-muted/50">
                        <td className="py-2.5 font-semibold text-foreground">{f.name}</td>
                        <td className="py-2.5 text-center font-mono">{f.vehicleCount}</td>
                        <td className="py-2.5 text-right font-mono font-bold text-emerald-600">{f.passRate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
