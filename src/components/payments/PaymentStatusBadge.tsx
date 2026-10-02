// FILE: src/components/payments/PaymentStatusBadge.tsx
// STAGE: 8
// UPDATED: 2026-10-02
import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface PaymentStatusBadgeProps {
  status: string;
  className?: string;
}

export function PaymentStatusBadge({ status, className }: PaymentStatusBadgeProps) {
  switch (status.toUpperCase()) {
    case 'PENDING':
      return (
        <Badge
          variant="outline"
          className={cn('border-amber-500/40 text-amber-600 bg-amber-500/10', className)}
        >
          Pending
        </Badge>
      );
    case 'PROCESSING':
      return (
        <Badge
          variant="outline"
          className={cn('border-blue-500/40 text-blue-600 bg-blue-500/10', className)}
        >
          Processing
        </Badge>
      );
    case 'COMPLETED':
    case 'COLLECTED':
      return (
        <Badge
          variant="default"
          className={cn('bg-emerald-600 hover:bg-emerald-700 text-white', className)}
        >
          Collected
        </Badge>
      );
    case 'FAILED':
      return (
        <Badge variant="destructive" className={className}>
          Failed
        </Badge>
      );
    case 'REFUNDED':
      return (
        <Badge
          variant="outline"
          className={cn('border-purple-500/40 text-purple-600 bg-purple-500/10', className)}
        >
          Refunded
        </Badge>
      );
    case 'EXPIRED':
      return (
        <Badge
          variant="outline"
          className={cn('border-zinc-500/40 text-zinc-600 bg-zinc-500/10', className)}
        >
          Expired
        </Badge>
      );
    case 'WAIVED':
      return (
        <Badge
          variant="outline"
          className={cn('border-zinc-400 text-zinc-500', className)}
        >
          Waived
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className={className}>
          {status}
        </Badge>
      );
  }
}
