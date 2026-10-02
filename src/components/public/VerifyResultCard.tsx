// FILE: src/components/public/VerifyResultCard.tsx
// STAGE: 11
// UPDATED: 2026-10-02
import * as React from 'react';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Clock, Search } from 'lucide-react';
import { formatDateTime, cn } from '@/lib/utils';

export type VerifyResult =
  | {
      kind: 'valid';
      inspectionCode: string;
      result: string;
      stationName: string;
      issuedAt: Date | null;
      expiresAt: Date | null;
    }
  | { kind: 'invalid' }
  | { kind: 'expired'; inspectionCode: string; expiresAt: Date }
  | { kind: 'not_found' };

export interface VerifyResultCardProps {
  code: string;
  result: VerifyResult;
}

export function VerifyResultCard({ code, result }: VerifyResultCardProps) {
  return (
    <Card className="w-full max-w-lg shadow-lg border-2">
      <CardHeader className="text-center space-y-3 pb-6 pt-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          {result.kind === 'valid' && <CheckCircle2 className="h-10 w-10 text-emerald-600" />}
          {result.kind === 'invalid' && <XCircle className="h-10 w-10 text-destructive" />}
          {result.kind === 'expired' && <Clock className="h-10 w-10 text-amber-600" />}
          {result.kind === 'not_found' && <Search className="h-10 w-10 text-muted-foreground" />}
        </div>

        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight">
            {result.kind === 'valid' && 'Valid Inspection Passport'}
            {result.kind === 'invalid' && 'Invalid Cryptographic Signature'}
            {result.kind === 'expired' && 'Inspection Passport Expired'}
            {result.kind === 'not_found' && 'Inspection Passport Not Found'}
          </h2>
          <p className="text-xs text-muted-foreground font-mono">
            Query ID: #{code}
          </p>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 px-8 pb-6">
        {result.kind === 'valid' && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <span className="text-muted-foreground font-medium">Overall Status:</span>
              <Badge
                variant="default"
                className={cn(
                  'font-bold text-xs uppercase',
                  result.result === 'PASSED'
                    ? 'bg-emerald-600 text-white'
                    : result.result === 'CONDITIONAL_PASS'
                    ? 'bg-amber-600 text-white'
                    : 'bg-red-600 text-white'
                )}
              >
                {result.result.replace(/_/g, ' ')}
              </Badge>
            </div>

            <div className="space-y-2.5">
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Inspection Serial Code:</span>
                <span className="font-mono font-semibold text-foreground">{result.inspectionCode}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Authorized Inspection Station:</span>
                <span className="font-medium text-foreground">{result.stationName}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Issued Timestamp:</span>
                <span className="font-mono text-foreground">{result.issuedAt ? formatDateTime(result.issuedAt) : '—'}</span>
              </div>
              <div className="flex justify-between pb-1">
                <span className="text-muted-foreground">Cryptographic Expiry:</span>
                <span className="font-mono text-foreground">{result.expiresAt ? formatDateTime(result.expiresAt) : '—'}</span>
              </div>
            </div>
          </div>
        )}

        {result.kind === 'invalid' && (
          <div className="rounded-md bg-destructive/10 p-4 text-center text-xs text-destructive space-y-1">
            <p className="font-semibold">Signature Verification Failed</p>
            <p className="text-[11px] text-destructive/80">
              This passport failed RSA-2048 cryptographic verification against the official authority public key. The payload may have been tampered with.
            </p>
          </div>
        )}

        {result.kind === 'expired' && (
          <div className="rounded-md bg-amber-500/10 p-4 text-center text-xs text-amber-700 dark:text-amber-400 space-y-1">
            <p className="font-semibold">Passport Validity Expired</p>
            <p className="text-[11px] opacity-90">
              Inspection code {result.inspectionCode} expired on {formatDateTime(result.expiresAt)}. A re-inspection is required for legal operation.
            </p>
          </div>
        )}

        {result.kind === 'not_found' && (
          <div className="rounded-md bg-muted p-4 text-center text-xs text-muted-foreground space-y-1">
            <p className="font-semibold text-foreground">No Record Matched</p>
            <p>No verified inspection matches code &quot;{code}&quot; in the national registry.</p>
          </div>
        )}
      </CardContent>

      <CardFooter className="border-t bg-muted/30 py-3 text-center text-[11px] text-muted-foreground justify-center">
        Results relate only to the items inspected. ISO/IEC 17020:2012.
      </CardFooter>
    </Card>
  );
}
