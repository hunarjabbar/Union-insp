// FILE: src/components/print/ReprintDialog.tsx
// STAGE: 13
// UPDATED: 2026-10-02
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { reprintReceipt } from '@/actions/receipts';

interface Props {
  receiptId: string;
  printerConfigId: string;
  currentReprintCount: number;
  onReprinted?: () => void;
  children?: React.ReactNode;
}

const MAX_REPRINTS = 3;

export function ReprintDialog({
  receiptId,
  printerConfigId,
  currentReprintCount,
  onReprinted,
  children,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [pending, setPending] = useState(false);

  const blocked = currentReprintCount >= MAX_REPRINTS;
  const reasonOk = reason.trim().length >= 10;

  async function handleReprint() {
    if (!reasonOk) return;
    setPending(true);
    const res = await reprintReceipt({ receiptId, printerConfigId, reason });
    setPending(false);
    if (!res.ok) {
      toast.error(res.error ?? 'Reprint failed');
      return;
    }
    toast.success('Receipt reprinted');
    setOpen(false);
    setReason('');
    onReprinted?.();
    router.refresh();
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        {children ?? <Button variant="outline">Reprint</Button>}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reprint receipt</AlertDialogTitle>
          <AlertDialogDescription>
            Reprint count so far: {currentReprintCount} / {MAX_REPRINTS}. All reprints are recorded
            in the audit log.
            {blocked && ' Reprint limit reached — contact a manager.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2">
          <Label htmlFor="reprint-reason">Reason (min 10 characters)</Label>
          <Textarea
            id="reprint-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g., Original was smudged or lost"
            rows={3}
            disabled={blocked}
          />
          <p className="text-xs text-muted-foreground">
            {reason.trim().length}/10 characters
          </p>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleReprint}
            disabled={!reasonOk || pending || blocked}
          >
            {pending ? 'Reprinting…' : 'Reprint'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
