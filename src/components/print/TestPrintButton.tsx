// FILE: src/components/print/TestPrintButton.tsx
// STAGE: 13
// UPDATED: 2026-10-02
'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Printer, Loader2 } from 'lucide-react';
import { buildInspectionReceipt } from '@/lib/print/encoder';
import { usePrinter } from '@/hooks/use-printer';

interface Props {
  printerConfigId: string;
}

const SAMPLE = {
  receiptNumber: 'RCP-TEST-000000',
  inspectionCode: 'UI-TEST-000000',
  plateNumber: 'TEST-0001',
  category: 'HEAVY_FREIGHT',
  stationName: 'Test Station',
  laneName: 'Lane 1',
  result: 'PASS',
  defects: [{ type: 'MINOR', description: 'Sample advisory' }],
  qrUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/verify/TEST-0000`,
  paidAmountIqd: 30000,
  paymentMethod: 'CASH',
  issuedAt: new Date(),
  widthMm: 80 as const,
};

export function TestPrintButton({ printerConfigId }: Props) {
  const [loading, setLoading] = useState(false);
  const { status, connect, print } = usePrinter(printerConfigId);

  async function handleTest() {
    setLoading(true);
    try {
      let ok = status === 'ONLINE';
      if (!ok) ok = await connect();
      if (!ok) {
        toast.error('Could not connect to printer');
        return;
      }
      await print(buildInspectionReceipt(SAMPLE));
      toast.success('Test receipt sent to printer');
    } catch {
      toast.error('Test print failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={handleTest} disabled={loading}>
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Printing…
        </>
      ) : (
        <>
          <Printer className="mr-2 h-4 w-4" />
          Print Test Receipt
        </>
      )}
    </Button>
  );
}
