// FILE: src/components/print/PrintReceiptButton.tsx
// STAGE: 13
// UPDATED: 2026-10-02
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Printer, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getReceiptPayload, markReceiptPrinted } from '@/actions/receipts';
import { buildInspectionReceipt } from '@/lib/print/encoder';
import { usePrinter } from '@/hooks/use-printer';
import { renderReceiptPdf } from '@/lib/print/pdf';

interface Props {
  receiptId: string;
  printerConfigId: string;
}

export function PrintReceiptButton({ receiptId, printerConfigId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { status, connect, print, lastError } = usePrinter(printerConfigId);

  async function handlePrint() {
    setLoading(true);
    try {
      const payloadRes = await getReceiptPayload(receiptId);
      if (!payloadRes.ok) {
        toast.error(payloadRes.error ?? 'Could not load receipt');
        return;
      }
      const rawPayload = payloadRes.data;
      const payload = {
        ...rawPayload,
        issuedAt: new Date(rawPayload.issuedAt),
      };

      // WebUSB path
      if (typeof navigator !== 'undefined' && 'usb' in navigator) {
        let connected = status === 'ONLINE';
        if (!connected) {
          connected = await connect();
        }
        if (connected) {
          const bytes = buildInspectionReceipt(payload);
          await print(bytes);
          await markReceiptPrinted(receiptId, printerConfigId);
          toast.success('Receipt printed');
          router.refresh();
          return;
        }
        // Fall through to PDF fallback if WebUSB failed
      }

      // PDF share-sheet fallback (iPad / Firefox)
      const pdfBuffer = await renderReceiptPdf(payload);
      const file = new File([new Uint8Array(pdfBuffer)], `${payload.receiptNumber}.pdf`, {
        type: 'application/pdf',
      });
      if (
        typeof navigator !== 'undefined' &&
        'share' in navigator &&
        navigator.canShare?.({ files: [file] })
      ) {
        await navigator.share({
          files: [file],
          title: `Receipt ${payload.receiptNumber}`,
        });
        await markReceiptPrinted(receiptId, printerConfigId);
        toast.success('Receipt shared');
      } else {
        // Plain download
        const url = URL.createObjectURL(file);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${payload.receiptNumber}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        await markReceiptPrinted(receiptId, printerConfigId);
        toast.success('Receipt downloaded as PDF');
      }
      router.refresh();
    } catch {
      toast.error(lastError ?? 'Print failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={handlePrint} disabled={loading}>
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Printing…
        </>
      ) : (
        <>
          <Printer className="mr-2 h-4 w-4" />
          Print Receipt
        </>
      )}
    </Button>
  );
}
