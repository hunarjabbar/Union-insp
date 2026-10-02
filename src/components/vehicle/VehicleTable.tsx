// FILE: src/components/vehicle/VehicleTable.tsx
// STAGE: 9
// UPDATED: 2026-10-02
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { formatDateTime, cn } from '@/lib/utils';
import { VehicleStatusBadge } from './VehicleStatusBadge';

export interface VehicleRow {
  id: string;
  plateNumber: string;
  vin: string | null;
  category: string;
  make: string | null;
  model: string | null;
  year: number | null;
  lastInspectionAt?: Date | string | null;
  complianceScore: number | null;
  fleetOwner: { companyName: string } | null;
}

export interface VehicleTableProps {
  rows: VehicleRow[];
}

export function VehicleTable({ rows }: VehicleTableProps) {
  const router = useRouter();
  const [search, setSearch] = React.useState('');

  const filteredRows = React.useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(
      (r) =>
        r.plateNumber.toLowerCase().includes(q) ||
        (r.vin && r.vin.toLowerCase().includes(q))
    );
  }, [rows, search]);

  const columns: Column<VehicleRow>[] = [
    {
      key: 'plateNumber',
      header: 'Plate',
      cell: (row) => <span className="font-semibold text-foreground">{row.plateNumber}</span>,
    },
    {
      key: 'vin',
      header: 'VIN',
      cell: (row) => (
        <span className="font-mono text-xs text-muted-foreground">
          {row.vin ? (row.vin.length > 8 ? `${row.vin.slice(0, 8)}...` : row.vin) : 'N/A'}
        </span>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      cell: (row) => {
        const cat = row.category;
        let badgeStyle = 'bg-zinc-500/10 text-zinc-700 border-zinc-500/30';
        if (cat === 'HEAVY_FREIGHT') {
          badgeStyle = 'bg-red-500/10 text-red-700 border-red-500/30 dark:text-red-400';
        } else if (cat === 'TOUR_BUS') {
          badgeStyle = 'bg-blue-500/10 text-blue-700 border-blue-500/30 dark:text-blue-400';
        } else if (cat === 'LIGHT_COMMERCIAL') {
          badgeStyle = 'bg-zinc-500/10 text-zinc-600 border-zinc-500/20';
        }
        return (
          <Badge variant="outline" className={cn('text-xs font-medium capitalize', badgeStyle)}>
            {cat.replace(/_/g, ' ').toLowerCase()}
          </Badge>
        );
      },
    },
    {
      key: 'makeModel',
      header: 'Make/Model',
      cell: (row) => (
        <span className="text-xs text-muted-foreground">
          {row.make || row.model ? `${row.make ?? ''} ${row.model ?? ''}`.trim() : 'N/A'}
        </span>
      ),
    },
    {
      key: 'year',
      header: 'Year',
      cell: (row) => <span className="text-xs text-muted-foreground">{row.year ?? 'N/A'}</span>,
    },
    {
      key: 'fleetOwner',
      header: 'Fleet Owner',
      cell: (row) => (
        <span className="text-xs text-muted-foreground">
          {row.fleetOwner?.companyName ?? 'Private / Individual'}
        </span>
      ),
    },
    {
      key: 'lastInspection',
      header: 'Last Inspection',
      cell: (row) => (
        <span className="text-xs text-muted-foreground">
          {row.lastInspectionAt ? formatDateTime(new Date(row.lastInspectionAt)) : 'Never'}
        </span>
      ),
    },
    {
      key: 'compliance',
      header: 'Compliance',
      cell: (row) => <VehicleStatusBadge score={row.complianceScore} />,
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 max-w-sm">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filter by plate or VIN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredRows}
        onRowClick={(row) => router.push(`/vehicles/${row.id}`)}
      />
    </div>
  );
}
