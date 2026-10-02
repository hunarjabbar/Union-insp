// FILE: src/components/syndicate/ReportDateRangePicker.tsx
// STAGE: 11
// UPDATED: 2026-10-02
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, Calendar } from 'lucide-react';

export interface ReportDateRangePickerProps {
  from: string;
  to: string;
  csvData?: {
    headers: string[];
    rows: (string | number)[][];
  };
}

export function ReportDateRangePicker({
  from,
  to,
  csvData,
}: ReportDateRangePickerProps) {
  const router = useRouter();
  const [fromDate, setFromDate] = React.useState(from);
  const [toDate, setToDate] = React.useState(to);

  function handleApply() {
    router.push(`/syndicate/reports?from=${fromDate}&to=${toDate}`);
  }

  function handleExportCsv() {
    if (!csvData || csvData.rows.length === 0) return;
    const csvContent = [
      csvData.headers.join(','),
      ...csvData.rows.map((row) =>
        row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `syndicate-report-${fromDate}_to_${toDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <Card className="p-4 bg-card">
      <CardContent className="p-0 flex flex-col md:flex-row items-stretch md:items-end justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="space-y-1 text-xs">
            <Label className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" /> From Date
            </Label>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="h-9 text-xs"
            />
          </div>

          <div className="space-y-1 text-xs">
            <Label className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" /> To Date
            </Label>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="h-9 text-xs"
            />
          </div>

          <Button size="sm" onClick={handleApply} className="h-9 mt-5">
            Apply Filter
          </Button>
        </div>

        {csvData && csvData.rows.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            className="h-9 gap-2"
          >
            <Download className="h-4 w-4" /> Export CSV Report
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
