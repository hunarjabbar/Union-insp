// FILE: src/components/layout/PrinterStatusIndicator.tsx
// STAGE: 7
// UPDATED: 2026-10-02
'use client';

import * as React from 'react';
import Link from 'next/link';
import { Printer } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { PrinterConfig } from '@prisma/client';

export function PrinterStatusIndicator() {
  const [printer, setPrinter] = React.useState<PrinterConfig | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;
    async function fetchDefaultPrinter() {
      try {
        const res = await fetch('/api/printers/default');
        if (res.ok) {
          const data = await res.json();
          if (mounted) setPrinter(data);
        }
      } catch {
        // Ignore fetch errors
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchDefaultPrinter();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="h-2 w-2 rounded-full bg-muted animate-pulse" />
        <span>Printer...</span>
      </div>
    );
  }

  if (!printer) {
    return (
      <Link
        href="/settings/printers"
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <span className="h-2 w-2 rounded-full bg-zinc-400" />
        <span>No printer</span>
      </Link>
    );
  }

  const statusDotColor = {
    ONLINE: 'bg-emerald-500',
    UNPAIRED: 'bg-amber-500',
    ERROR: 'bg-red-500',
    OFFLINE: 'bg-zinc-400',
    PAPER_OUT: 'bg-amber-500',
  }[printer.status] || 'bg-zinc-400';

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-accent"
        >
          <span className={cn('h-2 w-2 rounded-full', statusDotColor)} />
          <Printer className="h-3.5 w-3.5" />
          <span className="truncate max-w-[100px]">{printer.name}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 text-sm">
        <div className="space-y-2">
          <div className="flex items-center justify-between border-b pb-2">
            <span className="font-semibold text-foreground truncate">
              {printer.name}
            </span>
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                printer.status === 'ONLINE'
                  ? 'bg-emerald-500/10 text-emerald-600'
                  : 'bg-amber-500/10 text-amber-600'
              )}
            >
              {printer.status}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
            <span>Connection:</span>
            <span className="text-foreground text-right">
              {printer.connectionType}
            </span>
            <span>Paper Width:</span>
            <span className="text-foreground text-right">
              {printer.paperWidthMm}mm
            </span>
          </div>
          <div className="pt-2 border-t text-right">
            <Link
              href="/settings/printers"
              className="text-xs text-primary font-medium hover:underline"
            >
              Manage printers &rarr;
            </Link>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
