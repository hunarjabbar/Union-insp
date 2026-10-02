// FILE: src/components/financial/RevenueChart.tsx
// STAGE: 10
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
import { formatIQD } from '@/lib/utils';
import { BarChart3 } from 'lucide-react';

export interface RevenueChartProps {
  data: { day: string; totalIqd: number }[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  const formattedData = React.useMemo(() => {
    return data.map((item) => {
      const d = new Date(item.day);
      const label = isNaN(d.getTime())
        ? item.day
        : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return {
        ...item,
        label,
      };
    });
  }, [data]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-emerald-600" />
          Daily Revenue Overview (30 Days)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {formattedData.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-12">
            No revenue records available for this period.
          </p>
        ) : (
          <div className="h-[280px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={formattedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  tick={{ fill: 'currentColor' }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  tickFormatter={(val) => {
                    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
                    if (val >= 1_000) return `${(val / 1_000).toFixed(0)}k`;
                    return val;
                  }}
                  tick={{ fill: 'currentColor' }}
                />
                <Tooltip
                  formatter={(value: any) => [formatIQD(Number(value) || 0), 'Revenue']}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                    fontSize: '12px',
                    color: 'hsl(var(--card-foreground))',
                  }}
                />
                <Bar dataKey="totalIqd" fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
