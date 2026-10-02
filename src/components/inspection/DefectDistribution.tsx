// FILE: src/components/inspection/DefectDistribution.tsx
// STAGE: 8
// UPDATED: 2026-10-02
'use client';

import * as React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface DefectDistributionProps {
  data: { category: string; count: number }[];
}

function formatCategory(category: string): string {
  const parts = category.split('_');
  if (parts.length > 1) {
    return parts.slice(1).join(' ');
  }
  return category;
}

export function DefectDistribution({ data }: DefectDistributionProps) {
  const formattedData = data.map((d) => ({
    ...d,
    shortCategory: formatCategory(d.category),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">
          Defect Distribution (30d)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={formattedData}
              margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="shortCategory"
                tick={{ fontSize: 10 }}
                interval={0}
                angle={-25}
                textAnchor="end"
                className="text-xs text-muted-foreground fill-muted-foreground"
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                className="text-xs text-muted-foreground fill-muted-foreground"
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload as { category: string; count: number };
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm text-xs">
                        <div className="font-medium text-foreground">{item.category}</div>
                        <div className="text-muted-foreground">
                          Defects: <span className="font-semibold text-foreground">{item.count}</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
