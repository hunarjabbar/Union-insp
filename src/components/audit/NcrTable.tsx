// FILE: src/components/audit/NcrTable.tsx
// STAGE: 10
// UPDATED: 2026-10-02
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { NcrSeverityBadge, NcrStatusBadge } from './NcrStatusBadge';
import { formatDate } from '@/lib/utils';

export interface NcrRow {
  id: string;
  ncrNumber: string;
  title: string;
  severity: string;
  status: string;
  createdAt: Date | string;
  dueDate: Date | string | null;
  creator: { fullName: string };
}

export interface NcrTableProps {
  rows: NcrRow[];
}

export function NcrTable({ rows }: NcrTableProps) {
  const router = useRouter();
  const [search, setSearch] = React.useState('');

  const filteredRows = React.useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(
      (r) =>
        r.ncrNumber.toLowerCase().includes(q) ||
        r.title.toLowerCase().includes(q)
    );
  }, [rows, search]);

  const columns: Column<NcrRow>[] = [
    {
      key: 'ncrNumber',
      header: 'NCR #',
      cell: (row) => (
        <span className="font-mono font-bold text-foreground text-xs">
          {row.ncrNumber}
        </span>
      ),
    },
    {
      key: 'title',
      header: 'Non-Conformity Title',
      cell: (row) => (
        <span className="font-medium text-foreground text-xs line-clamp-1 max-w-[280px]">
          {row.title}
        </span>
      ),
    },
    {
      key: 'severity',
      header: 'Severity',
      cell: (row) => <NcrSeverityBadge severity={row.severity} />,
    },
    {
      key: 'status',
      header: 'Lifecycle Status',
      cell: (row) => <NcrStatusBadge status={row.status} />,
    },
    {
      key: 'createdAt',
      header: 'Raised Date',
      cell: (row) => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {formatDate(row.createdAt)}
        </span>
      ),
    },
    {
      key: 'dueDate',
      header: 'Corrective Due',
      cell: (row) => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {row.dueDate ? formatDate(row.dueDate) : '—'}
        </span>
      ),
    },
    {
      key: 'creator',
      header: 'Raised By',
      cell: (row) => (
        <span className="text-xs text-muted-foreground">
          {row.creator?.fullName ?? 'System Auditor'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="relative w-full sm:max-w-xs">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Filter NCRs by number or title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8 text-xs h-9"
        />
      </div>

      <DataTable
        columns={columns}
        data={filteredRows}
        onRowClick={(row) => router.push(`/audit/ncr/${row.id}`)}
      />
    </div>
  );
}
