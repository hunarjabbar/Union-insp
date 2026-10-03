// FILE: src/components/print/QrPreviewCard.tsx
// STAGE: 13
// UPDATED: 2026-10-02
'use client';

import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Props {
  qrDataUrl?: string | null;
  qrPayloadUrl: string;
  receiptNumber: string;
}

export function QrPreviewCard({ qrDataUrl, qrPayloadUrl, receiptNumber }: Props) {
  const [copied, setCopied] = useState(false);

  async function copyUrl() {
    await navigator.clipboard.writeText(qrPayloadUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Receipt QR</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {qrDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={qrDataUrl}
            alt={`QR for receipt ${receiptNumber}`}
            className="mx-auto h-48 w-48 rounded-md border bg-white p-2"
          />
        ) : (
          <div className="mx-auto flex h-48 w-48 items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">
            QR not generated
          </div>
        )}
        <div className="flex items-center gap-2">
          <code className="flex-1 truncate rounded bg-muted px-2 py-1 text-xs">
            {qrPayloadUrl}
          </code>
          <Button
            size="icon"
            variant="ghost"
            onClick={copyUrl}
            aria-label="Copy verification URL"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
