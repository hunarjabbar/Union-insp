// FILE: src/components/equipment/CalibrationBoardClient.tsx
// STAGE: 9
// UPDATED: 2026-10-02
'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CalibrationForm } from './CalibrationForm';
import { CalendarClock, Wrench, ShieldCheck, ShieldAlert, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { formatDate, cn } from '@/lib/utils';
import type { Equipment } from '@prisma/client';

export interface CalibrationEquipmentRow extends Equipment {
  station: { name: string };
  lane: { name: string } | null;
  calibrationLogs?: { calibratedAt: Date | string; certificateNo: string | null }[];
}

export interface CalibrationBoardClientProps {
  equipment: CalibrationEquipmentRow[];
}

function getStatusDetails(due: Date | string) {
  const diffTime = new Date(due).getTime() - Date.now();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return {
      label: 'EXPIRED / OVERDUE',
      style: 'bg-red-500/10 text-red-700 border-red-500/30',
      icon: ShieldAlert,
      message: `Calibration expired ${Math.abs(diffDays)} days ago!`,
    };
  }
  if (diffDays <= 30) {
    return {
      label: 'DUE SOON',
      style: 'bg-amber-500/10 text-amber-700 border-amber-500/30',
      icon: CalendarClock,
      message: `Expires in ${diffDays} days. Log calibration cycle soon.`,
    };
  }
  return {
    label: 'VALID',
    style: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30',
    icon: ShieldCheck,
    message: `Compliant. ${diffDays} days remaining.`,
  };
}

export function CalibrationBoardClient({ equipment }: CalibrationBoardClientProps) {
  const [loggingCalId, setLoggingCalId] = React.useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
              <Link href="/equipment">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">Calibration Board</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            ISO 17025 compliance center. Monitor and verify system alignment matrices.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {equipment.map((eq) => {
          if (eq.status === 'DECOMMISSIONED') return null;

          const cal = getStatusDetails(eq.calibrationDue);
          const Icon = cal.icon;
          const lastLog = eq.calibrationLogs?.[0];

          return (
            <Card key={eq.id} className="flex flex-col justify-between hover:shadow-sm transition-shadow">
              <CardHeader className="pb-3 border-b">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <span className="font-mono text-[10px] font-bold text-muted-foreground tracking-wider block">
                      {eq.serialNumber}
                    </span>
                    <CardTitle className="text-sm font-bold leading-tight">{eq.name}</CardTitle>
                  </div>
                  <Badge variant="outline" className={cn('text-[10px] font-bold shrink-0', cal.style)}>
                    {cal.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4 pb-3 text-xs space-y-2">
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">Station:</span>
                  <span className="font-semibold text-foreground">{eq.station.name}</span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">Lane Assignment:</span>
                  <span className="font-medium text-foreground">{eq.lane?.name ?? 'Standalone Hardware'}</span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">Last Calibrated:</span>
                  <span className="font-medium text-foreground">
                    {lastLog ? formatDate(new Date(lastLog.calibratedAt)) : 'Never Recorded'}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Calibration Due:</span>
                  <span className="font-bold text-foreground">{formatDate(new Date(eq.calibrationDue))}</span>
                </div>

                <div className="mt-3 flex items-center gap-1.5 p-2.5 rounded-lg border bg-muted/30 text-[11px] font-medium text-muted-foreground leading-normal">
                  <Icon className="h-4 w-4 shrink-0 text-foreground" />
                  <span>{cal.message}</span>
                </div>
              </CardContent>
              <CardFooter className="pt-2 pb-4 border-t flex justify-end">
                <Button
                  size="sm"
                  className="gap-1.5 h-8 text-xs font-semibold"
                  onClick={() => setLoggingCalId(eq.id)}
                >
                  <Wrench className="h-3.5 w-3.5" /> Log Calibration
                </Button>
              </CardFooter>
            </Card>
          );
        })}

        {equipment.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-12 border rounded-xl bg-card col-span-full">
            No diagnostic equipment found. Register hardware components first.
          </p>
        )}
      </div>

      {/* Dialog */}
      <Dialog open={!!loggingCalId} onOpenChange={(open) => !open && setLoggingCalId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Log Hardware Calibration Cycle</DialogTitle>
          </DialogHeader>
          {loggingCalId && (
            <CalibrationForm
              equipmentId={loggingCalId}
              onClose={() => setLoggingCalId(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
