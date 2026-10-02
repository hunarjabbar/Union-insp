// FILE: src/components/equipment/EquipmentTable.tsx
// STAGE: 9
// UPDATED: 2026-10-02
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { CalibrationForm } from './CalibrationForm';
import { deleteEquipment } from '@/actions/equipment';
import { toast } from 'sonner';
import { Activity, Wrench, Trash2 } from 'lucide-react';
import { formatDate, cn } from '@/lib/utils';
import type { Equipment } from '@prisma/client';

export interface EquipmentRow extends Equipment {
  station: { name: string };
  lane: { name: string } | null;
}

export interface EquipmentTableProps {
  rows: EquipmentRow[];
  isSuperAdmin?: boolean;
}

function getAbbreviatedType(type: string): string {
  switch (type) {
    case 'TIRE_SCANNER_3D':
      return 'TS3D';
    case 'BRAKE_ROLLER_TESTER':
      return 'BRT';
    case 'LIGHT_BEAM_ALIGNER':
      return 'LBA';
    case 'LUX_METER':
      return 'LUX';
    case 'PRESSURE_SENSOR':
      return 'TPMS';
    case 'QR_PRINTER':
      return 'PRN';
    case 'LANE_CONTROLLER':
      return 'CTRL';
    default:
      return 'EQ';
  }
}

function getCalibrationStatus(due: Date | string) {
  const diffTime = new Date(due).getTime() - Date.now();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return { outcome: 'EXPIRED', style: 'bg-red-500/10 text-red-700 border-red-500/30' };
  }
  if (diffDays <= 30) {
    return { outcome: 'DUE SOON', style: 'bg-amber-500/10 text-amber-700 border-amber-500/30' };
  }
  return { outcome: 'VALID', style: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30' };
}

export function EquipmentTable({ rows, isSuperAdmin = false }: EquipmentTableProps) {
  const router = useRouter();
  const [loggingCalId, setLoggingCalId] = React.useState<string | null>(null);

  async function handleDelete(id: string) {
    try {
      const res = await deleteEquipment(id);
      if (res.ok) {
        toast.success('Equipment status updated to DECOMMISSIONED');
        router.refresh();
      } else {
        toast.error(res.error || 'Failed to decommission equipment');
      }
    } catch {
      toast.error('Unexpected error while updating equipment status.');
    }
  }

  const columns: Column<EquipmentRow>[] = [
    {
      key: 'serialNumber',
      header: 'Serial No',
      cell: (row) => <span className="font-mono text-xs font-semibold text-foreground">{row.serialNumber}</span>,
    },
    {
      key: 'type',
      header: 'Classification',
      cell: (row) => (
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className="font-mono text-[10px] font-bold px-1.5 py-0.5">
            {getAbbreviatedType(row.type)}
          </Badge>
          <span className="text-xs text-muted-foreground truncate max-w-[120px]">{row.name}</span>
        </div>
      ),
    },
    {
      key: 'station',
      header: 'Station',
      cell: (row) => <span className="text-xs text-muted-foreground">{row.station.name}</span>,
    },
    {
      key: 'lane',
      header: 'Lane',
      cell: (row) => <span className="text-xs text-muted-foreground">{row.lane?.name ?? 'Standalone'}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => {
        const s = row.status.toUpperCase();
        let style = 'bg-zinc-500/10 text-zinc-600 border-zinc-500/30';
        if (s === 'OPERATIONAL') {
          style = 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30';
        } else if (s === 'CALIBRATION_DUE' || s === 'DEGRADED') {
          style = 'bg-amber-500/10 text-amber-700 border-amber-500/30';
        } else if (s === 'OUT_OF_SERVICE' || s === 'FAULT') {
          style = 'bg-red-500/10 text-red-700 border-red-500/30';
        } else if (s === 'DECOMMISSIONED') {
          style = 'bg-zinc-800 text-white dark:bg-zinc-200 dark:text-black border-transparent';
        }
        return (
          <Badge variant="outline" className={cn('text-[10px] font-bold uppercase tracking-wider', style)}>
            {s.replace(/_/g, ' ')}
          </Badge>
        );
      },
    },
    {
      key: 'calibration',
      header: 'Calibration Status',
      cell: (row) => {
        const cal = getCalibrationStatus(row.calibrationDue);
        return (
          <div className="flex flex-col gap-0.5">
            <Badge variant="outline" className={cn('text-[10px] font-bold w-fit', cal.style)}>
              {cal.outcome}
            </Badge>
            <span className="text-[10px] text-muted-foreground font-mono">
              Due: {formatDate(new Date(row.calibrationDue))}
            </span>
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => setLoggingCalId(row.id)}
            disabled={row.status === 'DECOMMISSIONED'}
          >
            <Activity className="h-3 w-3" /> Log Cal
          </Button>

          {isSuperAdmin && row.status !== 'DECOMMISSIONED' && (
            <ConfirmDialog
              title="Decommission Hardware Equipment?"
              description="Warning: Decommissioning this hardware shifts its status to DECOMMISSIONED and deactivates automatic lane logging. This is a terminal registry operation."
              confirmLabel="Decommission"
              variant="destructive"
              onConfirm={() => handleDelete(row.id)}
              trigger={
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50">
                  <Trash2 className="h-3.5 w-3.5" />
                  <span className="sr-only">Decommission Equipment</span>
                </Button>
              }
            />
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-2">
      <DataTable columns={columns} data={rows} />

      {/* Calibration Form Dialog */}
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
