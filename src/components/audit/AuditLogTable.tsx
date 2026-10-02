// FILE: src/components/audit/AuditLogTable.tsx
// STAGE: 10
// UPDATED: 2026-10-02
'use client';

import * as React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { RoleBadge } from '@/components/layout/RoleBadge';
import { formatDateTime } from '@/lib/utils';
import type { Role } from '@prisma/client';

export interface AuditLogRow {
  id: string;
  sequence: bigint | number;
  action: string;
  entityType: string;
  entityId: string | null;
  ipAddress: string | null;
  createdAt: Date | string;
  hash: string;
  previousHash: string | null;
  user: { fullName: string; role: string } | null;
}

export interface AuditLogTableProps {
  rows: AuditLogRow[];
}

export function AuditLogTable({ rows }: AuditLogTableProps) {
  const [search, setSearch] = React.useState('');

  const filteredRows = React.useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(
      (r) =>
        r.action.toLowerCase().includes(q) ||
        r.entityType.toLowerCase().includes(q) ||
        (r.entityId && r.entityId.toLowerCase().includes(q)) ||
        (r.user?.fullName && r.user.fullName.toLowerCase().includes(q))
    );
  }, [rows, search]);

  const columns: Column<AuditLogRow>[] = [
    {
      key: 'sequence',
      header: 'Seq',
      cell: (row) => (
        <span className="font-mono text-xs text-muted-foreground text-right block">
          #{String(row.sequence)}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Timestamp',
      cell: (row) => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {formatDateTime(new Date(row.createdAt))}
        </span>
      ),
    },
    {
      key: 'user',
      header: 'Operator / User',
      cell: (row) => (
        <div className="space-y-0.5">
          <span className="font-semibold text-foreground text-xs block">
            {row.user?.fullName ?? 'System / Daemon'}
          </span>
          {row.user?.role && <RoleBadge role={row.user.role as Role} />}
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Audit Action',
      cell: (row) => {
        const act = row.action;
        let variant: 'default' | 'destructive' | 'secondary' | 'outline' = 'outline';

        if (act.includes('CREATE') || act.includes('LOGIN_SUCCESS')) {
          variant = 'default';
        } else if (
          act.includes('OVERRIDE') ||
          act.includes('DELETE') ||
          act.includes('FAIL') ||
          act.includes('REVOKE') ||
          act.includes('SUSPEND')
        ) {
          variant = 'destructive';
        } else if (act.includes('UPDATE') || act.includes('ASSIGN')) {
          variant = 'secondary';
        }

        return (
          <Badge variant={variant} className="text-[10px] font-mono tracking-wide">
            {act}
          </Badge>
        );
      },
    },
    {
      key: 'entity',
      header: 'Target Entity',
      cell: (row) => (
        <div className="text-xs">
          <span className="font-medium text-foreground">{row.entityType}</span>
          {row.entityId && (
            <span className="font-mono text-muted-foreground block text-[11px] truncate max-w-[120px]">
              #{row.entityId}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'ipAddress',
      header: 'IP Origin',
      cell: (row) => (
        <span className="font-mono text-[11px] text-muted-foreground">
          {row.ipAddress ?? '—'}
        </span>
      ),
    },
    {
      key: 'hash',
      header: 'SHA-256 Hash',
      cell: (row) => (
        <span
          className="font-mono text-[11px] text-muted-foreground"
          title={row.hash}
        >
          {row.hash ? `${row.hash.slice(0, 12)}…` : '—'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold tracking-tight">Immutable Audit Log</h2>
          <p className="text-xs text-muted-foreground">
            Cryptographically chained event ledger with sequence integrity verification.
          </p>
        </div>
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filter audit entries..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 text-xs h-9"
          />
        </div>
      </div>

      <DataTable columns={columns} data={filteredRows} />
    </div>
  );
}
