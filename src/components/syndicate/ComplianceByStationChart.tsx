// FILE: src/components/syndicate/ComplianceByStationChart.tsx
// STAGE: 11
// UPDATED: 2026-10-02
'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { BarChart3 } from 'lucide-react';

export interface ComplianceStationData {
  stationName: string;
  passRate: number;
  total: number;
}

export interface ComplianceByStationChartProps {
  data: ComplianceStationData[];
}

export function ComplianceByStationChart({ data }: ComplianceByStationChartProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-blue-600" />
          Compliance Pass Rate by Station (30d)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-12">
            No station compliance metrics available.
          </p>
        ) : (
          <div className="h-[300px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis
                  dataKey="stationName"
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  tick={{ fill: 'currentColor' }}
                />
                <YAxis
                  domain={[0, 100]}
                  unit="%"
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  tick={{ fill: 'currentColor' }}
                />
                <Tooltip
                  formatter={(value: any, name: any, props: any) => [
                    `${Number(value).toFixed(1)}% (${props.payload.total} total inspections)`,
                    'Pass Rate',
                  ]}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                    fontSize: '12px',
                    color: 'hsl(var(--card-foreground))',
                  }}
                />
                <Bar dataKey="passRate" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
