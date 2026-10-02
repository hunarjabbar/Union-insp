// FILE: src/components/audit/NcrStatusBadge.tsx
// STAGE: 10
// UPDATED: 2026-10-02
import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function NcrSeverityBadge({ severity }: { severity?: string | null }) {
  const s = severity?.toUpperCase() || 'ADVISORY';
  let style = 'bg-zinc-500/10 text-zinc-600 border-zinc-500/30';
  let variant: 'default' | 'destructive' | 'secondary' | 'outline' = 'outline';

  if (s === 'CRITICAL') {
    variant = 'destructive';
  } else if (s === 'MAJOR') {
    style = 'bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-400';
  } else if (s === 'MINOR') {
    style = 'bg-blue-500/15 text-blue-700 border-blue-500/30 dark:text-blue-400';
  }

  return (
    <Badge
      variant={variant}
      className={cn('text-[10px] font-bold uppercase tracking-wider', style)}
    >
      {s}
    </Badge>
  );
}

export function NcrStatusBadge({ status }: { status?: string | null }) {
  const s = status?.toUpperCase() || 'OPEN';
  let style = 'bg-zinc-500/10 text-zinc-600 border-zinc-500/30';
  let variant: 'default' | 'destructive' | 'secondary' | 'outline' = 'outline';

  if (s === 'OPEN') {
    variant = 'destructive';
  } else if (s === 'INVESTIGATING') {
    style = 'bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-400';
  } else if (s === 'CORRECTIVE_ACTION_ASSIGNED') {
    style = 'bg-blue-500/15 text-blue-700 border-blue-500/30 dark:text-blue-400';
  } else if (s === 'RESOLVED') {
    style = 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-400';
  }

  return (
    <Badge
      variant={variant}
      className={cn('text-[10px] font-bold uppercase tracking-wider', style)}
    >
      {s.replace(/_/g, ' ')}
    </Badge>
  );
}
