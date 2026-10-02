// FILE: src/components/financial/DailyReconciliation.tsx
// STAGE: 10
// UPDATED: 2026-10-02
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { reconcileDaily } from '@/actions/financial';
import { formatIQD, formatDate } from '@/lib/utils';
import { Loader2, Calculator, CheckCircle2 } from 'lucide-react';

export interface DailyReportRow {
  id: string;
  reportDate: Date | string;
  totalInspections: number;
  totalRevenueIqd: number;
  cashCollectedIqd: number;
  electronicCollectedIqd: number;
  reconciled: boolean;
  station: { name: string };
}

export interface DailyReconciliationProps {
  stations: { id: string; name: string }[];
  defaultStationId?: string;
  recentReports: DailyReportRow[];
}

export function DailyReconciliation({
  stations,
  defaultStationId,
  recentReports,
}: DailyReconciliationProps) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  const [stationId, setStationId] = React.useState(defaultStationId || stations[0]?.id || '');
  const [date, setDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [cashIqd, setCashIqd] = React.useState('0');
  const [electronicIqd, setElectronicIqd] = React.useState('0');

  const totalCalc = (Number(cashIqd) || 0) + (Number(electronicIqd) || 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stationId) {
      toast.error('Please select a station');
      return;
    }
    setPending(true);
    try {
      const res = await reconcileDaily({
        stationId,
        date,
        cashIqd: Number(cashIqd) || 0,
        electronicIqd: Number(electronicIqd) || 0,
      });
      if (res.ok) {
        toast.success('Daily financial reconciliation logged successfully');
        router.refresh();
      } else {
        toast.error(res.error || 'Failed to reconcile daily revenue');
      }
    } catch {
      toast.error('Unexpected error during reconciliation.');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Calculator className="h-4 w-4 text-emerald-600" />
            End-of-Day Till Closing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <Label>Select Station *</Label>
              <Select value={stationId} onValueChange={setStationId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose station..." />
                </SelectTrigger>
                <SelectContent>
                  {stations.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Reconciliation Date *</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>Physical Cash Drawer Collected (IQD) *</Label>
              <Input
                type="number"
                min="0"
                step="1000"
                value={cashIqd}
                onChange={(e) => setCashIqd(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>Electronic Gateway Collected (IQD) *</Label>
              <Input
                type="number"
                min="0"
                step="1000"
                value={electronicIqd}
                onChange={(e) => setElectronicIqd(e.target.value)}
                required
              />
            </div>

            <div className="rounded-md bg-muted p-3 space-y-1 font-mono">
              <div className="flex justify-between text-muted-foreground text-[11px]">
                <span>Combined Till Total:</span>
                <span className="font-bold text-foreground">{formatIQD(totalCalc)}</span>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Reconciling Ledger...
                </span>
              ) : (
                'Submit Daily Reconciliation'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Recent Reports Table Card */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            Recent Reconciliation Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentReports.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">
              No recent daily reports found.
            </p>
          ) : (
            <div className="divide-y text-xs max-h-[420px] overflow-y-auto pr-1">
              {recentReports.map((rep) => (
                <div key={rep.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <span className="font-semibold text-foreground block">
                      {rep.station.name}
                    </span>
                    <span className="text-muted-foreground text-[11px]">
                      {formatDate(rep.reportDate)} · {rep.totalInspections} inspections
                    </span>
                  </div>
                  <div className="text-right space-y-0.5">
                    <span className="font-mono font-bold text-foreground block">
                      {formatIQD(rep.totalRevenueIqd)}
                    </span>
                    <span className="text-[10px] text-muted-foreground block">
                      Cash: {formatIQD(rep.cashCollectedIqd)} / E-Pay: {formatIQD(rep.electronicCollectedIqd)}
                    </span>
                  </div>
                  <Badge variant={rep.reconciled ? 'default' : 'destructive'} className="text-[10px]">
                    {rep.reconciled ? 'Balanced' : 'Discrepancy'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
