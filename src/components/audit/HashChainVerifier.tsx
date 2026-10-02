// FILE: src/components/audit/HashChainVerifier.tsx
// STAGE: 10
// UPDATED: 2026-10-02
'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ShieldCheck, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface HashChainVerifierProps {
  valid: boolean;
  totalEntries: number;
  violations: string[];
}

export function HashChainVerifier({
  valid,
  totalEntries,
  violations,
}: HashChainVerifierProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            {valid ? (
              <Badge
                variant="outline"
                className={cn(
                  'gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-400 cursor-help'
                )}
              >
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                Audit Chain Verified ({totalEntries} entries)
              </Badge>
            ) : (
              <Badge
                variant="destructive"
                className="gap-1.5 px-3 py-1.5 text-xs font-semibold cursor-help"
              >
                <ShieldAlert className="h-4 w-4 shrink-0" />
                INTEGRITY VIOLATION ({violations.length})
              </Badge>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-xs space-y-1 p-3">
          {valid ? (
            <p>
              SHA-256 hash chain integrity confirmed. All {totalEntries} entries
              are tamper-evident and sequentially linked.
            </p>
          ) : (
            <div className="space-y-1">
              <p className="font-bold text-red-500">Hash Chain Violations Detected:</p>
              <ul className="list-disc pl-4 font-mono text-[11px] space-y-0.5">
                {violations.slice(0, 5).map((v, i) => (
                  <li key={i}>{v}</li>
                ))}
              </ul>
              {violations.length > 5 && (
                <p className="text-[10px] text-muted-foreground">
                  ...and {violations.length - 5} more violation(s).
                </p>
              )}
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
