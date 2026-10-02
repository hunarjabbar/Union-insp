// FILE: src/components/station/StationTable.tsx
// STAGE: 9
// UPDATED: 2026-10-02
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { cn } from '@/lib/utils';
import type { Station } from '@prisma/client';

export interface StationRow extends Station {
  _count?: { lanes: number; users: number };
}

export interface StationTableProps {
  rows: StationRow[];
}

export function StationTable({ rows }: StationTableProps) {
  const router = useRouter();

  const columns: Column<StationRow>[] = [
    {
      key: 'name',
      header: 'Station Name',
      cell: (row) => (
        <div>
          <span className="font-semibold text-foreground block">{row.name}</span>
          <span className="text-[10px] text-muted-foreground block font-mono">ID: {row.id}</span>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      cell: (row) => {
        const t = row.type;
        const style =
          t === 'BORDER_TERMINAL'
            ? 'bg-purple-500/10 text-purple-700 border-purple-500/30'
            : 'bg-indigo-500/10 text-indigo-700 border-indigo-500/30';
        return (
          <Badge variant="outline" className={cn('text-xs font-medium uppercase', style)}>
            {t.replace(/_/g, ' ')}
          </Badge>
        );
      },
    },
    {
      key: 'address',
      header: 'Address',
      cell: (row) => <span className="text-xs text-muted-foreground">{row.address}</span>,
    },
    {
      key: 'lanes',
      header: 'Lanes',
      cell: (row) => <span className="text-xs font-medium">{row._count?.lanes ?? 0}</span>,
    },
    {
      key: 'users',
      header: 'Personnel',
      cell: (row) => <span className="text-xs font-medium">{row._count?.users ?? 0}</span>,
    },
    {
      key: 'isActive',
      header: 'Status',
      cell: (row) => (
        <Badge
          variant="outline"
          className={cn(
            'text-[10px] font-bold uppercase tracking-wider',
            row.isActive
              ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30'
              : 'bg-red-500/10 text-red-700 border-red-500/30'
          )}
        >
          {row.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={rows}
      onRowClick={(row) => router.push(`/stations/${row.id}`)}
    />
  );
}
