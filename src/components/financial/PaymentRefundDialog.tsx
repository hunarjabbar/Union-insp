// FILE: src/components/financial/PaymentRefundDialog.tsx
// STAGE: 10
// UPDATED: 2026-10-02
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { refundPayment } from '@/actions/payments';
import { formatIQD } from '@/lib/utils';

export interface PaymentRefundDialogProps {
  paymentId: string;
  amountIqd: number;
  open: boolean;
  onClose: () => void;
}

export function PaymentRefundDialog({
  paymentId,
  amountIqd,
  open,
  onClose,
}: PaymentRefundDialogProps) {
  const router = useRouter();
  const [refundAmount, setRefundAmount] = React.useState(String(amountIqd));
  const [reason, setReason] = React.useState('');
  const [pending, setPending] = React.useState(false);

  async function handleRefund(e: React.FormEvent) {
    e.preventDefault();
    const amt = Number(refundAmount);
    if (isNaN(amt) || amt <= 0 || amt > amountIqd) {
      toast.error(`Refund amount must be between 1 and ${amountIqd} IQD`);
      return;
    }
    if (reason.trim().length < 10) {
      toast.error('Please provide a detailed justification (at least 10 characters)');
      return;
    }

    setPending(true);
    try {
      const res = await refundPayment(paymentId, amt, reason.trim());
      if (res.ok) {
        toast.success('Payment successfully refunded via gateway');
        onClose();
        router.refresh();
      } else {
        toast.error(res.error || 'Failed to process refund');
      }
    } catch {
      toast.error('Unexpected error while processing payment refund.');
    } finally {
      setPending(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(op) => !op && onClose()}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" /> Process Payment Refund
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs text-muted-foreground">
            Refunds are irreversible and will be logged in the immutable audit chain. The gateway refund API will be called immediately.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <form onSubmit={handleRefund} className="space-y-4 pt-2 text-xs">
          <div className="space-y-1.5">
            <Label>Refund Amount (IQD) — Max: {formatIQD(amountIqd)}</Label>
            <Input
              type="number"
              min="1"
              max={amountIqd}
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label>Audit Justification / Reason *</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Provide reason for refund (e.g. duplicate payment, inspection cancelled)..."
              required
              className="min-h-[80px]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive" size="sm" disabled={pending}>
              {pending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Processing Refund...
                </span>
              ) : (
                'Confirm Refund'
              )}
            </Button>
          </div>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
