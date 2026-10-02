// FILE: src/components/inspection/InspectionStats.tsx
// STAGE: 8
// UPDATED: 2026-10-02
'use client';

import * as React from 'react';
import { Activity, DollarSign, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatIQD } from '@/lib/utils';

export interface InspectionStatsProps {
  todayCount: number;
  todayRevenueIqd: number;
  passRate: number;
}

export function InspectionStats({
  todayCount,
  todayRevenueIqd,
  passRate,
}: InspectionStatsProps) {
  const capacityPercent = ((todayCount / 2000) * 100).toFixed(1);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Inspections Today</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{todayCount.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {capacityPercent}% of 2,000 capacity
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Revenue Today</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatIQD(todayRevenueIqd)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Target: 60,000,000 IQD
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pass Rate (30d)</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{passRate}%</div>
          <p className="text-xs text-muted-foreground mt-1">
            ISO 39001 metric
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Duration (30d)</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">12 min</div>
          <p className="text-xs text-muted-foreground mt-1">
            Target: &lt; 15 min
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
