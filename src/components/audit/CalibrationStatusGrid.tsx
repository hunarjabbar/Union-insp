// FILE: src/components/audit/CalibrationStatusGrid.tsx
// STAGE: 10
// UPDATED: 2026-10-02
import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wrench } from 'lucide-react';
import { formatDate, cn } from '@/lib/utils';

export interface EquipmentRow {
  id: string;
  serialNumber: string;
  type: string;
  status: string;
  calibrationStatus: string;
  calibrationDue?: Date | string | null;
  nextCalibrationAt?: Date | string | null;
  station: { name: string };
}

export interface CalibrationStatusGridProps {
  equipment: EquipmentRow[];
}

function CalibrationBadge({ status }: { status: string }) {
  const s = status?.toUpperCase() || 'VALID';
  let style = 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-400';
  if (s === 'DUE_SOON') {
    style = 'bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-400';
  } else if (s === 'EXPIRED' || s === 'OVERDUE') {
    style = 'bg-red-500/15 text-red-700 border-red-500/30 dark:text-red-400';
  }
  return (
    <Badge variant="outline" className={cn('text-[10px] font-bold uppercase tracking-wider', style)}>
      {s.replace(/_/g, ' ')}
    </Badge>
  );
}

export function CalibrationStatusGrid({ equipment }: CalibrationStatusGridProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Wrench className="h-4 w-4 text-blue-600" />
          Hardware Calibration Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        {equipment.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            No diagnostic equipment registered.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 max-h-[380px] overflow-y-auto pr-1">
            {equipment.map((eq) => {
              const due = eq.calibrationDue ?? eq.nextCalibrationAt ?? null;
              return (
                <div key={eq.id} className="rounded-md border p-3 space-y-1 bg-card/50">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-foreground truncate">
                      {eq.type.replace(/_/g, ' ')}
                    </span>
                    <CalibrationBadge status={eq.calibrationStatus} />
                  </div>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    SN: {eq.serialNumber}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Station: {eq.station.name}
                  </p>
                  <p className="text-[11px] pt-0.5">
                    Next Due: {due ? formatDate(due) : 'Not Scheduled'}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
