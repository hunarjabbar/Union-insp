// FILE: src/components/lane/LaneTable.tsx
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
import { LaneForm } from './LaneForm';
import { deleteLane } from '@/actions/lanes';
import { toast } from 'sonner';
import { Edit, Trash2 } from 'lucide-react';
import { formatDate, cn } from '@/lib/utils';
import type { Lane } from '@prisma/client';

export interface LaneRow extends Lane {
  _count?: { inspections: number };
}

export interface LaneTableProps {
  rows: LaneRow[];
  stationId: string;
  isSuperAdmin?: boolean;
}

export function LaneTable({ rows, stationId, isSuperAdmin = false }: LaneTableProps) {
  const router = useRouter();
  const [editingLane, setEditingLane] = React.useState<LaneRow | null>(null);

  async function handleDelete(id: string) {
    try {
      const res = await deleteLane(id);
      if (res.ok) {
        toast.success('Lane removed from station registry');
        router.refresh();
      } else {
        toast.error(res.error || 'Failed to remove lane');
      }
    } catch {
      toast.error('Unexpected error while removing lane.');
    }
  }

  const columns: Column<LaneRow>[] = [
    {
      key: 'laneNumber',
      header: 'Lane #',
      cell: (row) => <span className="font-bold text-foreground">Lane #{row.laneNumber}</span>,
    },
    {
      key: 'name',
      header: 'Name',
      cell: (row) => <span className="text-xs text-muted-foreground">{row.name}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => {
        const s = row.status;
        let style = 'bg-zinc-500/10 text-zinc-600 border-zinc-500/30';
        if (s === 'ACTIVE') {
          style = 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30';
        } else if (s === 'MAINTENANCE') {
          style = 'bg-amber-500/10 text-amber-700 border-amber-500/30';
        } else if (s === 'CALIBRATION_REQUIRED') {
          style = 'bg-red-500/10 text-red-700 border-red-500/30';
        }
        return (
          <Badge variant="outline" className={cn('text-[10px] font-bold uppercase tracking-wider', style)}>
            {s.replace(/_/g, ' ')}
          </Badge>
        );
      },
    },
    {
      key: 'lastCalibration',
      header: 'Last Calibration',
      cell: (row) => (
        <span className="text-xs text-muted-foreground">
          {row.lastCalibration ? formatDate(new Date(row.lastCalibration)) : 'Never'}
        </span>
      ),
    },
    {
      key: 'nextCalibration',
      header: 'Next Calibration',
      cell: (row) => (
        <span className="text-xs text-muted-foreground">
          {row.nextCalibration ? formatDate(new Date(row.nextCalibration)) : 'Never'}
        </span>
      ),
    },
    {
      key: 'inspections',
      header: 'Inspections',
      cell: (row) => <span className="text-xs font-semibold">{row._count?.inspections ?? 0}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setEditingLane(row)}>
            <Edit className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="sr-only">Edit Lane</span>
          </Button>

          {isSuperAdmin && (
            <ConfirmDialog
              title="Delete Lane Configuration?"
              description="Warning: Deleting this lane will also orphan database references for physical equipment and print configs. Are you absolutely sure?"
              confirmLabel="Delete Lane"
              variant="destructive"
              onConfirm={() => handleDelete(row.id)}
              trigger={
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50">
                  <Trash2 className="h-3.5 w-3.5" />
                  <span className="sr-only">Delete Lane</span>
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

      {/* Editing Dialog Modal */}
      <Dialog open={!!editingLane} onOpenChange={(open) => !open && setEditingLane(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Lane #{editingLane?.laneNumber} Registry</DialogTitle>
          </DialogHeader>
          {editingLane && (
            <LaneForm
              stationId={stationId}
              lane={editingLane}
              onClose={() => setEditingLane(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
