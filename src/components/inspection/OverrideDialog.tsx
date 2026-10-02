// FILE: src/components/inspection/OverrideDialog.tsx
// STAGE: 8
// UPDATED: 2026-10-02
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AlertCircle, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { overrideDefect } from '@/actions/inspections';
import { cn } from '@/lib/utils';

export interface OverrideDialogProps {
  inspectionId: string;
}

export function OverrideDialog({ inspectionId }: OverrideDialogProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);

  const [parameter, setParameter] = React.useState('');
  const [machineValue, setMachineValue] = React.useState('');
  const [overrideValue, setOverrideValue] = React.useState('');
  const [justification, setJustification] = React.useState('');

  const charCount = justification.length;
  const isJustificationValid = charCount >= 30;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!parameter.trim() || !machineValue.trim() || !overrideValue.trim()) {
      toast.error('All parameter fields are required');
      return;
    }
    if (!isJustificationValid) {
      toast.error('Justification must contain at least 30 characters');
      return;
    }

    setPending(true);
    try {
      const res = await overrideDefect({
        inspectionId,
        parameter: parameter.trim(),
        machineValue: machineValue.trim(),
        overrideValue: overrideValue.trim(),
        justification: justification.trim(),
      });

      if (res.ok) {
        toast.success('Inspection defect overridden successfully');
        setOpen(false);
        router.refresh();
      } else {
        toast.error(res.error || 'Failed to record override');
      }
    } catch {
      toast.error('Network error while applying override');
    } finally {
      setPending(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 border-amber-500/40 text-amber-700 hover:bg-amber-500/10">
          <AlertCircle className="h-4 w-4" /> Override Defect
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <AlertDialogHeader>
            <AlertDialogTitle>Managerial Defect Override</AlertDialogTitle>
            <AlertDialogDescription>
              Overrides are recorded in the immutable SHA-256 audit ledger and countersigned by compliance auditors.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Parameter Identifier</Label>
              <Input
                placeholder="e.g. brake_efficiency_axle1"
                value={parameter}
                onChange={(e) => setParameter(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Machine Value</Label>
                <Input
                  placeholder="e.g. 48%"
                  value={machineValue}
                  onChange={(e) => setMachineValue(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Override Target Value</Label>
                <Input
                  placeholder="e.g. 52%"
                  value={overrideValue}
                  onChange={(e) => setOverrideValue(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label className="text-xs">Technical Justification</Label>
                <span
                  className={cn(
                    'text-[11px]',
                    isJustificationValid ? 'text-muted-foreground' : 'text-amber-600 font-medium'
                  )}
                >
                  {charCount}/30 chars minimum
                </span>
              </div>
              <Textarea
                placeholder="Detailed regulatory or engineering justification for overriding machine result..."
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                className="min-h-[90px] text-xs"
                required
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <Button
              type="submit"
              disabled={pending || !isJustificationValid}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {pending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
                </span>
              ) : (
                'Submit Override'
              )}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
