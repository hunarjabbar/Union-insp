// FILE: src/components/inspection/QrPreview.tsx
// STAGE: 8
// UPDATED: 2026-10-02
'use client';

import * as React from 'react';
import { Copy, Check, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export interface QrPreviewProps {
  dataUrl?: string | null;
  verifyUrl?: string | null;
}

export function QrPreview({ dataUrl, verifyUrl }: QrPreviewProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    if (!verifyUrl) return;
    navigator.clipboard.writeText(verifyUrl);
    setCopied(true);
    toast.success('Verification URL copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 rounded-lg border bg-card/60 text-center space-y-3">
      {dataUrl ? (
        <div className="p-3 bg-white rounded-lg shadow-sm border inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={dataUrl}
            alt="Inspection QR Certificate"
            className="h-44 w-44 object-contain"
          />
        </div>
      ) : (
        <div className="h-44 w-44 rounded-lg border-2 border-dashed flex flex-col items-center justify-center p-4 text-muted-foreground space-y-2">
          <QrCode className="h-10 w-10 text-muted-foreground/40" />
          <span className="text-xs">QR will appear after issuance</span>
        </div>
      )}

      {verifyUrl && (
        <div className="flex items-center gap-2 max-w-full">
          <span className="font-mono text-[11px] text-muted-foreground truncate bg-muted px-2 py-1 rounded max-w-[220px]">
            {verifyUrl}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-7 w-7 p-0 shrink-0"
            title="Copy verification link"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <Copy className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
