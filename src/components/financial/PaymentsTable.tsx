// FILE: src/components/financial/PaymentsTable.tsx
// STAGE: 10
// UPDATED: 2026-10-02
'use client';

import * as React from 'react';
import { Search, RotateCcw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { PaymentStatusBadge } from '@/components/payments/PaymentStatusBadge';
import { PaymentRefundDialog } from './PaymentRefundDialog';
import { formatIQD, formatDateTime, cn } from '@/lib/utils';

export interface PaymentRow {
  id: string;
  provider: string;
  amountIqd: number;
  status: string;
  gatewayRef: string | null;
  createdAt: Date | string;
  completedAt: Date | string | null;
  inspection: {
    inspectionCode: string;
    vehicle: { plateNumber: string };
  };
}

export interface PaymentsTableProps {
  rows: PaymentRow[];
  canRefund: boolean;
}

export function PaymentsTable({ rows, canRefund }: PaymentsTableProps) {
  const [search, setSearch] = React.useState('');
  const [providerFilter, setProviderFilter] = React.useState('ALL');
  const [statusFilter, setStatusFilter] = React.useState('ALL');
  const [refundTarget, setRefundTarget] = React.useState<PaymentRow | null>(null);

  const filteredRows = React.useMemo(() => {
    return rows.filter((r) => {
      const matchSearch =
        !search.trim() ||
        r.id.toLowerCase().includes(search.toLowerCase()) ||
        r.inspection?.inspectionCode?.toLowerCase().includes(search.toLowerCase()) ||
        r.inspection?.vehicle?.plateNumber?.toLowerCase().includes(search.toLowerCase()) ||
        (r.gatewayRef && r.gatewayRef.toLowerCase().includes(search.toLowerCase()));

      const matchProvider = providerFilter === 'ALL' || r.provider === providerFilter;
      const matchStatus = statusFilter === 'ALL' || r.status === statusFilter;

      return matchSearch && matchProvider && matchStatus;
    });
  }, [rows, search, providerFilter, statusFilter]);

  const columns: Column<PaymentRow>[] = [
    {
      key: 'id',
      header: 'Payment ID',
      cell: (row) => (
        <span className="font-mono text-xs text-muted-foreground" title={row.id}>
          #{row.id.slice(0, 8)}…
        </span>
      ),
    },
    {
      key: 'inspection',
      header: 'Inspection',
      cell: (row) => (
        <span className="font-mono font-semibold text-foreground text-xs">
          {row.inspection?.inspectionCode ?? 'N/A'}
        </span>
      ),
    },
    {
      key: 'plate',
      header: 'Vehicle Plate',
      cell: (row) => (
        <span className="font-semibold text-foreground text-xs">
          {row.inspection?.vehicle?.plateNumber ?? 'N/A'}
        </span>
      ),
    },
    {
      key: 'provider',
      header: 'Gateway Provider',
      cell: (row) => {
        const prov = row.provider?.toUpperCase() || 'CASH';
        let style = 'bg-zinc-500/10 text-zinc-700 border-zinc-500/30';
        if (prov === 'FASTPAY') style = 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-400';
        else if (prov === 'ZAINCASH') style = 'bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-400';
        else if (prov === 'FIB') style = 'bg-blue-500/15 text-blue-700 border-blue-500/30 dark:text-blue-400';
        else if (prov === 'CASH') style = 'bg-emerald-500/10 text-emerald-800 border-emerald-500/20';
        else if (prov === 'NASSPAY') style = 'bg-purple-500/15 text-purple-700 border-purple-500/30 dark:text-purple-400';
        else if (prov === 'QICARD') style = 'bg-zinc-600/10 text-zinc-700 border-zinc-600/30';

        return (
          <Badge variant="outline" className={cn('text-[10px] font-bold uppercase tracking-wider', style)}>
            {prov}
          </Badge>
        );
      },
    },
    {
      key: 'amountIqd',
      header: 'Amount',
      cell: (row) => (
        <span className="font-mono font-bold text-foreground text-xs">
          {formatIQD(row.amountIqd)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => <PaymentStatusBadge status={row.status} />,
    },
    {
      key: 'createdAt',
      header: 'Initiated',
      cell: (row) => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {formatDateTime(new Date(row.createdAt))}
        </span>
      ),
    },
    {
      key: 'completedAt',
      header: 'Completed',
      cell: (row) => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {row.completedAt ? formatDateTime(new Date(row.completedAt)) : '—'}
        </span>
      ),
    },
    ...(canRefund
      ? [
          {
            key: 'actions',
            header: 'Actions',
            cell: (row: PaymentRow) => (
              <div onClick={(e) => e.stopPropagation()}>
                {row.status === 'COMPLETED' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => setRefundTarget(row)}
                  >
                    <RotateCcw className="h-3 w-3" /> Refund
                  </Button>
                )}
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search payments by ID, plate..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 text-xs h-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={providerFilter} onValueChange={setProviderFilter}>
            <SelectTrigger className="w-[140px] text-xs h-9">
              <SelectValue placeholder="Provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Providers</SelectItem>
              <SelectItem value="FASTPAY">FastPay</SelectItem>
              <SelectItem value="ZAINCASH">ZainCash</SelectItem>
              <SelectItem value="FIB">FIB</SelectItem>
              <SelectItem value="CASH">Cash</SelectItem>
              <SelectItem value="NASSPAY">NassPay</SelectItem>
              <SelectItem value="QICARD">QiCard</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px] text-xs h-9">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
              <SelectItem value="REFUNDED">Refunded</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DataTable columns={columns as any} data={filteredRows} />

      {refundTarget && (
        <PaymentRefundDialog
          paymentId={refundTarget.id}
          amountIqd={refundTarget.amountIqd}
          open={!!refundTarget}
          onClose={() => setRefundTarget(null)}
        />
      )}
    </div>
  );
}
