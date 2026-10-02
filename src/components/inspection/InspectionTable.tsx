// FILE: src/components/inspection/InspectionTable.tsx
// STAGE: 8
// UPDATED: 2026-10-02
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { PaymentStatusBadge } from '@/components/payments/PaymentStatusBadge';
import { formatDateTime, cn } from '@/lib/utils';

export interface InspectionRow {
  id: string;
  inspectionCode: string;
  overallResult: string | null;
  status: string;
  createdAt: Date | string;
  feeAmountIqd: number;
  paymentStatus: string;
  vehicle: { plateNumber: string; category: string };
  station: { name: string };
  inspector: { fullName: string };
}

export interface InspectionTableProps {
  rows: InspectionRow[];
}

export function InspectionTable({ rows }: InspectionTableProps) {
  const router = useRouter();
  const [search, setSearch] = React.useState('');

  const filteredRows = React.useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(
      (r) =>
        r.inspectionCode.toLowerCase().includes(q) ||
        r.vehicle.plateNumber.toLowerCase().includes(q)
    );
  }, [rows, search]);

  const columns: Column<InspectionRow>[] = [
    {
      key: 'inspectionCode',
      header: 'Code',
      cell: (row) => (
        <span className="font-mono text-xs font-semibold">{row.inspectionCode}</span>
      ),
    },
    {
      key: 'plate',
      header: 'Plate',
      cell: (row) => (
        <span className="font-medium text-foreground">{row.vehicle.plateNumber}</span>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      cell: (row) => (
        <span className="text-xs text-muted-foreground capitalize">
          {row.vehicle.category.replace(/_/g, ' ').toLowerCase()}
        </span>
      ),
    },
    {
      key: 'station',
      header: 'Station',
      cell: (row) => (
        <span className="text-xs text-muted-foreground">{row.station.name}</span>
      ),
    },
    {
      key: 'inspector',
      header: 'Inspector',
      cell: (row) => (
        <span className="text-xs text-muted-foreground">{row.inspector.fullName}</span>
      ),
    },
    {
      key: 'result',
      header: 'Result',
      cell: (row) => {
        const res = (row.overallResult || row.status).toUpperCase();
        let badgeStyle = 'bg-zinc-500/10 text-zinc-600 border-zinc-500/30';
        if (res === 'PASSED' || res === 'PASS') {
          badgeStyle = 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-400';
        } else if (res === 'CONDITIONAL_PASS') {
          badgeStyle = 'bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-400';
        } else if (res === 'FAILED' || res === 'FAIL') {
          badgeStyle = 'bg-red-500/10 text-red-700 border-red-500/30 dark:text-red-400';
        } else if (res === 'PENDING_COUNTERSIGN') {
          badgeStyle = 'bg-purple-500/10 text-purple-700 border-purple-500/30 dark:text-purple-400';
        }

        return (
          <Badge variant="outline" className={cn('font-medium text-xs', badgeStyle)}>
            {res.replace(/_/g, ' ')}
          </Badge>
        );
      },
    },
    {
      key: 'paymentStatus',
      header: 'Payment',
      cell: (row) => <PaymentStatusBadge status={row.paymentStatus} />,
    },
    {
      key: 'time',
      header: 'Time',
      cell: (row) => (
        <span className="text-xs text-muted-foreground">
          {formatDateTime(new Date(row.createdAt))}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 max-w-sm">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filter by code or plate..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredRows}
        onRowClick={(row) => router.push(`/inspection/${row.id}`)}
      />
    </div>
  );
}
