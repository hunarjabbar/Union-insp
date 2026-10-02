// FILE: src/components/syndicate/FleetRiskTable.tsx
// STAGE: 11
// UPDATED: 2026-10-02
import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/shared/EmptyState';
import { ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FleetRiskRow {
  fleetId: string;
  companyName: string;
  vehicleCount: number;
  passRate: number;
  criticalDefects: number;
}

export interface FleetRiskTableProps {
  rows: FleetRiskRow[];
}

export function FleetRiskTable({ rows }: FleetRiskTableProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-red-600" />
          Top 10 Fleets by Safety & Compliance Risk
        </CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <EmptyState
            title="No fleet risk data"
            description="All commercial fleet owners maintain pristine compliance records."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b text-muted-foreground font-semibold">
                  <th className="pb-2.5 font-medium">Fleet Operator</th>
                  <th className="pb-2.5 font-medium text-center">Vehicles</th>
                  <th className="pb-2.5 font-medium text-center">Pass Rate</th>
                  <th className="pb-2.5 font-medium text-center">Critical</th>
                  <th className="pb-2.5 font-medium text-right">Risk Score</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((fleet) => {
                  const passRate = fleet.passRate ?? 0;
                  const crit = fleet.criticalDefects ?? 0;
                  const riskScore = Math.round((100 - passRate) + crit * 5);

                  let badgeStyle = 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30';
                  if (passRate < 50) badgeStyle = 'bg-red-500/15 text-red-700 border-red-500/30';
                  else if (passRate < 75) badgeStyle = 'bg-amber-500/15 text-amber-700 border-amber-500/30';
                  else if (passRate < 90) badgeStyle = 'bg-blue-500/15 text-blue-700 border-blue-500/30';

                  return (
                    <tr key={fleet.fleetId} className="hover:bg-muted/50 transition-colors">
                      <td className="py-2.5 font-semibold text-foreground">
                        {fleet.companyName}
                      </td>
                      <td className="py-2.5 text-center font-mono text-muted-foreground">
                        {fleet.vehicleCount}
                      </td>
                      <td className="py-2.5 text-center">
                        <Badge variant="outline" className={cn('text-[10px] font-bold', badgeStyle)}>
                          {passRate}%
                        </Badge>
                      </td>
                      <td className="py-2.5 text-center font-mono">
                        <span className={cn('font-bold', crit > 0 ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground')}>
                          {crit}
                        </span>
                      </td>
                      <td className="py-2.5 text-right font-mono font-bold text-foreground">
                        {riskScore}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
