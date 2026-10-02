// FILE: src/components/print/printer-table.tsx
// STAGE: 9
// UPDATED: 2026-10-02
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { PairPrinterButton } from './pair-printer-button';
import { deletePrinterConfig } from '@/actions/printers';
import { toast } from 'sonner';
import { Edit, Trash2, ArrowRight } from 'lucide-react';
import { formatDateTime, cn } from '@/lib/utils';
import type { PrinterConfig } from '@prisma/client';

export interface PrinterConfigRow extends PrinterConfig {
  station: { name: string };
  lane: { name: string } | null;
}

export interface PrinterTableProps {
  rows: PrinterConfigRow[];
  isSuperAdmin?: boolean;
}

export function PrinterTable({ rows, isSuperAdmin = false }: PrinterTableProps) {
  const router = useRouter();

  async function handleDelete(id: string) {
    try {
      const res = await deletePrinterConfig(id);
      if (res.ok) {
        toast.success('Printer configuration deleted successfully');
        router.refresh();
      } else {
        toast.error(res.error || 'Failed to delete printer config');
      }
    } catch {
      toast.error('Unexpected error while deleting printer.');
    }
  }

  const columns: Column<PrinterConfigRow>[] = [
    {
      key: 'name',
      header: 'Label',
      cell: (row) => (
        <div>
          <span className="font-semibold text-foreground text-xs block">{row.name}</span>
          {row.isDefault && (
            <Badge variant="secondary" className="text-[9px] uppercase px-1 py-0 h-4 mt-0.5">
              Default Fallback
            </Badge>
          )}
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
      header: 'Lane Assignment',
      cell: (row) => <span className="text-xs text-muted-foreground">{row.lane?.name ?? 'Station Shared'}</span>,
    },
    {
      key: 'connectionType',
      header: 'Interface',
      cell: (row) => <span className="font-mono text-xs uppercase text-muted-foreground">{row.connectionType}</span>,
    },
    {
      key: 'width',
      header: 'Width',
      cell: (row) => <span className="text-xs font-semibold">{row.paperWidthMm}mm</span>,
    },
    {
      key: 'status',
      header: 'Telemetry Status',
      cell: (row) => {
        const s = row.status?.toUpperCase() || 'UNPAIRED';
        let style = 'bg-zinc-500/10 text-zinc-600 border-zinc-500/30';
        if (s === 'ONLINE') {
          style = 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30';
        } else if (s === 'PAPER_OUT') {
          style = 'bg-amber-500/10 text-amber-700 border-amber-500/30';
        } else if (s === 'ERROR') {
          style = 'bg-red-500/10 text-red-700 border-red-500/30';
        } else if (s === 'UNPAIRED' || s === 'OFFLINE') {
          style = 'bg-amber-500/10 text-amber-700 border-amber-500/30';
        }
        return (
          <Badge variant="outline" className={cn('text-[10px] font-bold uppercase tracking-wider', style)}>
            {s}
          </Badge>
        );
      },
    },
    {
      key: 'lastSeenAt',
      header: 'Last Seen Online',
      cell: (row) => (
        <span className="text-xs text-muted-foreground font-mono">
          {row.lastSeenAt ? formatDateTime(new Date(row.lastSeenAt)) : 'Never'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <PairPrinterButton printerConfigId={row.id} onPaired={() => router.refresh()} />

          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => router.push(`/settings/printers/${row.id}`)}>
            <Edit className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="sr-only">Edit Printer</span>
          </Button>

          {isSuperAdmin && (
            <ConfirmDialog
              title="Delete Printer Configuration?"
              description="Warning: Deleting this printer registry configuration cannot be undone. Any lanes linked to this fallback unit will revert to offline thermal routing."
              confirmLabel="Delete Printer"
              variant="destructive"
              onConfirm={() => handleDelete(row.id)}
              trigger={
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50">
                  <Trash2 className="h-3.5 w-3.5" />
                  <span className="sr-only">Delete Printer</span>
                </Button>
              }
            />
          )}
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={rows}
      onRowClick={(row) => router.push(`/settings/printers/${row.id}`)}
    />
  );
}
