// FILE: src/components/layout/RoleBadge.tsx
// STAGE: 7
// UPDATED: 2026-10-02
import * as React from 'react';
import { Role } from '@prisma/client';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface RoleBadgeProps {
  role: Role;
  className?: string;
}

const ROLE_STYLES: Record<Role, string> = {
  SUPER_ADMIN: 'bg-red-500/15 text-red-700 border-red-500/30 dark:text-red-400',
  STATION_MANAGER: 'bg-blue-500/15 text-blue-700 border-blue-500/30 dark:text-blue-400',
  LEAD_INSPECTOR: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-400',
  COMPLIANCE_AUDITOR: 'bg-purple-500/15 text-purple-700 border-purple-500/30 dark:text-purple-400',
  SYNDICATE_REPRESENTATIVE: 'bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-400',
  INSPECTION_TECHNICIAN: 'bg-zinc-500/15 text-zinc-700 border-zinc-500/30 dark:text-zinc-300',
  CASHIER: 'bg-cyan-500/15 text-cyan-700 border-cyan-500/30 dark:text-cyan-400',
};

function formatRoleTitle(role: string): string {
  return role
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const style = ROLE_STYLES[role] ?? 'bg-muted text-muted-foreground';
  return (
    <Badge
      variant="outline"
      className={cn('font-medium shadow-none select-none', style, className)}
    >
      {formatRoleTitle(role)}
    </Badge>
  );
}
