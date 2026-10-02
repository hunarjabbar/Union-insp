// FILE: src/components/vehicle/VehicleStatusBadge.tsx
// STAGE: 9
// UPDATED: 2026-10-02
import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface VehicleStatusBadgeProps {
  score: number | null;
  className?: string;
}

export function VehicleStatusBadge({ score, className }: VehicleStatusBadgeProps) {
  if (score === null) {
    return (
      <Badge variant="outline" className={cn('bg-zinc-500/10 text-zinc-600 border-zinc-500/30', className)}>
        N/A
      </Badge>
    );
  }
  if (score >= 90) {
    return (
      <Badge variant="outline" className={cn('bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-400', className)}>
        Excellent ({score}%)
      </Badge>
    );
  }
  if (score >= 75) {
    return (
      <Badge variant="outline" className={cn('bg-blue-500/10 text-blue-700 border-blue-500/30 dark:text-blue-400', className)}>
        Good ({score}%)
      </Badge>
    );
  }
  if (score >= 50) {
    return (
      <Badge variant="outline" className={cn('bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-400', className)}>
        Fair ({score}%)
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className={cn('bg-red-500/10 text-red-700 border-red-500/30 dark:text-red-400', className)}>
      Poor ({score}%)
    </Badge>
  );
}
