// FILE: src/hooks/use-printer.ts
// STAGE: 9
// UPDATED: 2026-10-02
'use client';

import * as React from 'react';
import { WebUSBTransport } from '@/lib/print/transport';

export type PrinterStatus = 'UNSUPPORTED' | 'UNPAIRED' | 'ONLINE' | 'OFFLINE' | 'CONNECTING';

export interface UsePrinterResult {
  status: PrinterStatus;
  connect: () => Promise<boolean>;
  print: (bytes: Uint8Array) => Promise<void>;
  disconnect: () => void;
  lastError: string | null;
}

export function usePrinter(printerConfigId?: string): UsePrinterResult {
  const [status, setStatus] = React.useState<PrinterStatus>('OFFLINE');
  const [lastError, setLastError] = React.useState<string | null>(null);
  const transportRef = React.useRef<WebUSBTransport | null>(null);

  const storageKey = React.useMemo(() => {
    return `union.printer.${printerConfigId ?? 'default'}`;
  }, [printerConfigId]);

  // Check support and set initial status on mount
  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!(navigator as any).usb) {
      setStatus('UNSUPPORTED');
      return;
    }

    transportRef.current = new WebUSBTransport();

    const saved = localStorage.getItem(storageKey);
    if (saved) {
      setStatus('OFFLINE'); // Paired but currently disconnected
    } else {
      setStatus('UNPAIRED');
    }
  }, [storageKey]);

  const connect = React.useCallback(async () => {
    if (!transportRef.current) {
      setLastError('WebUSB transport is not initialized or not supported.');
      return false;
    }

    setStatus('CONNECTING');
    setLastError(null);

    try {
      const ok = await transportRef.current.connect();
      if (ok) {
        setStatus('ONLINE');
        // Save pair info to mark as paired
        const info = {
          pairedAt: new Date().toISOString(),
          configId: printerConfigId ?? 'default',
        };
        localStorage.setItem(storageKey, JSON.stringify(info));
        return true;
      } else {
        setStatus('OFFLINE');
        setLastError('Failed to establish WebUSB interface connection.');
        return false;
      }
    } catch (e: any) {
      setStatus('OFFLINE');
      const msg = e?.message || 'Error occurred during connection.';
      setLastError(msg);
      return false;
    }
  }, [storageKey, printerConfigId]);

  const print = React.useCallback(async (bytes: Uint8Array) => {
    if (!transportRef.current) {
      throw new Error('WebUSB printer is not initialized.');
    }
    try {
      await transportRef.current.print(bytes);
    } catch (e: any) {
      const msg = e?.message || 'Print job failed.';
      setLastError(msg);
      throw e;
    }
  }, []);

  const disconnect = React.useCallback(() => {
    if (transportRef.current) {
      transportRef.current.disconnect();
    }
    localStorage.removeItem(storageKey);
    setStatus('UNPAIRED');
  }, [storageKey]);

  return {
    status,
    connect,
    print,
    disconnect,
    lastError,
  };
}
