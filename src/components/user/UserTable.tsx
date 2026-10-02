// FILE: src/components/user/UserTable.tsx
// STAGE: 9
// UPDATED: 2026-10-02
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { RoleBadge } from '@/components/layout/RoleBadge';
import { formatDateTime, cn } from '@/lib/utils';
import type { Role } from '@prisma/client';

export interface UserRow {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  status: string;
  mfaEnabled: boolean;
  lastLoginAt: Date | string | null;
  station: { name: string } | null;
}

export interface UserTableProps {
  rows: UserRow[];
}

export function UserTable({ rows }: UserTableProps) {
  const router = useRouter();

  const columns: Column<UserRow>[] = [
    {
      key: 'fullName',
      header: 'Representative Name',
      cell: (row) => (
        <div>
          <span className="font-semibold text-foreground block">{row.fullName}</span>
          <span className="text-[10px] text-muted-foreground block font-mono">{row.email}</span>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Assigned Role',
      cell: (row) => <RoleBadge role={row.role} className="text-[10px]" />,
    },
    {
      key: 'station',
      header: 'Default Office',
      cell: (row) => (
        <span className="text-xs text-muted-foreground">
          {row.station?.name ?? 'HQ / General Registry'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => {
        const s = row.status.toUpperCase();
        let style = 'bg-zinc-500/10 text-zinc-600 border-zinc-500/30';
        if (s === 'ACTIVE') {
          style = 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30';
        } else if (s === 'PENDING_VERIFICATION') {
          style = 'bg-amber-500/10 text-amber-700 border-amber-500/30';
        } else if (s === 'SUSPENDED') {
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
      key: 'mfa',
      header: 'MFA',
      cell: (row) => (
        <div className="flex justify-center">
          {row.mfaEnabled ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          ) : (
            <XCircle className="h-4 w-4 text-zinc-400 shrink-0" />
          )}
        </div>
      ),
    },
    {
      key: 'lastLogin',
      header: 'Last Seen Auth',
      cell: (row) => (
        <span className="text-xs text-muted-foreground">
          {row.lastLoginAt ? formatDateTime(new Date(row.lastLoginAt)) : 'Never'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      cell: (row) => (
        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => router.push(`/users/${row.id}`)}>
          Configure <ArrowRight className="h-3 w-3" />
        </Button>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={rows}
      onRowClick={(row) => router.push(`/users/${row.id}`)}
    />
  );
}
