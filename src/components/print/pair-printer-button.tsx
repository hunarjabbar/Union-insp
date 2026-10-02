// FILE: src/components/print/pair-printer-button.tsx
// STAGE: 9
// UPDATED: 2026-10-02
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { usePrinter } from '@/hooks/use-printer';
import { reportPrinterStatus } from '@/actions/printers';
import { Printer, Loader2 } from 'lucide-react';

export interface PairPrinterButtonProps {
  printerConfigId: string;
  onPaired?: () => void;
}

export function PairPrinterButton({ printerConfigId, onPaired }: PairPrinterButtonProps) {
  const { status, connect, lastError } = usePrinter(printerConfigId);
  const [connecting, setConnecting] = React.useState(false);

  React.useEffect(() => {
    if (lastError) {
      toast.error(lastError);
    }
  }, [lastError]);

  async function handlePair() {
    setConnecting(true);
    try {
      const ok = await connect();
      if (ok) {
        // Report status to backend
        const res = await reportPrinterStatus({
          id: printerConfigId,
          status: 'ONLINE',
        });
        if (res.ok) {
          toast.success('Thermal receipt printer paired successfully via WebUSB');
          onPaired?.();
        } else {
          toast.error(res.error || 'Failed to report online printer status to backend');
        }
      }
    } catch {
      toast.error('Unexpected hardware communication error during WebUSB handshakes.');
    } finally {
      setConnecting(false);
    }
  }

  const isUnsupported = status === 'UNSUPPORTED';

  return (
    <Button
      variant={status === 'ONLINE' ? 'outline' : 'default'}
      size="sm"
      className="gap-2"
      disabled={isUnsupported || connecting}
      onClick={handlePair}
      title={isUnsupported ? 'WebUSB not supported in this browser' : undefined}
    >
      {connecting ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" /> Connecting...
        </>
      ) : status === 'ONLINE' ? (
        <>
          <Printer className="h-4 w-4 text-emerald-600 animate-pulse" /> Connected
        </>
      ) : status === 'UNSUPPORTED' ? (
        'Unsupported Browser'
      ) : (
        <>
          <Printer className="h-4 w-4" /> Pair Printer via WebUSB
        </>
      )}
    </Button>
  );
}
