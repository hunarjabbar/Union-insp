// FILE: src/components/syndicate/SyndicateRevenueCard.tsx
// STAGE: 11
// UPDATED: 2026-10-02
import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatIQD } from '@/lib/utils';
import { DollarSign, TrendingUp, ShieldCheck, Layers } from 'lucide-react';

export interface SyndicateRevenueCardProps {
  summary: {
    totalRevenueIqd: number;
    syndicateShareIqd: number;
    taxWithheldIqd: number;
    totalInspections: number;
  };
}

export function SyndicateRevenueCard({ summary }: SyndicateRevenueCardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
            Certified inspection gross fee revenue
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
            Allocated worker syndicate reserve
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
            Remitted regional treasury withholding
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
            Total completed vehicle inspections
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
