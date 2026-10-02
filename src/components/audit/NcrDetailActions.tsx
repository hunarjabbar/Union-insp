// FILE: src/components/audit/NcrDetailActions.tsx
// STAGE: 10
// UPDATED: 2026-10-02
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { assignNcr, resolveNcr, closeNcr } from '@/actions/ncrs';
import { UserCheck, CheckCircle2, ShieldCheck, Loader2 } from 'lucide-react';

export interface NcrDetailActionsProps {
  ncrId: string;
  currentStatus: string;
  users: { id: string; fullName: string; role: string }[];
  canClose: boolean;
}

export function NcrDetailActions({ ncrId, currentStatus, users, canClose }: NcrDetailActionsProps) {
  const router = useRouter();
  const [assignOpen, setAssignOpen] = React.useState(false);
  const [resolveOpen, setResolveOpen] = React.useState(false);
  const [selectedAssignee, setSelectedAssignee] = React.useState('');
  const [correctiveAction, setCorrectiveAction] = React.useState('');
  const [preventiveAction, setPreventiveAction] = React.useState('');
  const [pending, setPending] = React.useState(false);

  async function handleAssign() {
    if (!selectedAssignee) {
      toast.error('Please select an operator to assign');
      return;
    }
    setPending(true);
    try {
      const res = await assignNcr(ncrId, selectedAssignee);
      if (res.ok) {
        toast.success('NCR successfully assigned for investigation');
        setAssignOpen(false);
        router.refresh();
      } else {
        toast.error(res.error || 'Failed to assign NCR');
      }
    } catch {
      toast.error('Unexpected error while assigning NCR.');
    } finally {
      setPending(false);
    }
  }

  async function handleResolve(e: React.FormEvent) {
    e.preventDefault();
    if (!correctiveAction.trim()) {
      toast.error('Corrective action description is required');
      return;
    }
    setPending(true);
    try {
      const res = await resolveNcr({
        id: ncrId,
        correctiveAction,
        preventiveAction,
      });
      if (res.ok) {
        toast.success('NCR marked as resolved');
        setResolveOpen(false);
        router.refresh();
      } else {
        toast.error(res.error || 'Failed to resolve NCR');
      }
    } catch {
      toast.error('Unexpected error while resolving NCR.');
    } finally {
      setPending(false);
    }
  }

  async function handleClose() {
    try {
      const res = await closeNcr(ncrId);
      if (res.ok) {
        toast.success('NCR closed and archived in audit ledger');
        router.refresh();
      } else {
        toast.error(res.error || 'Failed to close NCR');
      }
    } catch {
      toast.error('Unexpected error while closing NCR.');
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Remediation Controls</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Assign Dialog */}
        <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="w-full gap-2 text-xs justify-start">
              <UserCheck className="h-4 w-4 text-blue-600" /> Assign Operator
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Assign NCR Investigation</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2 text-xs">
              <div className="space-y-1.5">
                <Label>Select Qualified Inspector / Manager</Label>
                <Select value={selectedAssignee} onValueChange={setSelectedAssignee}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose personnel..." />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.fullName} ({u.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setAssignOpen(false)}>Cancel</Button>
                <Button size="sm" onClick={handleAssign} disabled={pending}>
                  {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Assignment'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Resolve Dialog */}
        <Dialog open={resolveOpen} onOpenChange={setResolveOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="w-full gap-2 text-xs justify-start">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Submit Resolution
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Submit Corrective Resolution</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleResolve} className="space-y-3 pt-2 text-xs">
              <div className="space-y-1">
                <Label>Corrective Action Implemented *</Label>
                <Textarea
                  value={correctiveAction}
                  onChange={(e) => setCorrectiveAction(e.target.value)}
                  placeholder="Describe calibration adjustment or replacement..."
                  required
                  className="min-h-[90px]"
                />
              </div>
              <div className="space-y-1">
                <Label>Preventive Measures</Label>
                <Textarea
                  value={preventiveAction}
                  onChange={(e) => setPreventiveAction(e.target.value)}
                  placeholder="Preventative recommendations..."
                  className="min-h-[70px]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setResolveOpen(false)}>Cancel</Button>
                <Button type="submit" size="sm" disabled={pending}>
                  {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Resolve NCR'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Close NCR (Super Admin / Auditor) */}
        {canClose && currentStatus !== 'CLOSED' && (
          <ConfirmDialog
            title="Close & Archive NCR?"
            description="Closing this non-conformity report locks the corrective action audit trail and marks the finding as permanently satisfied."
            confirmLabel="Close NCR"
            variant="destructive"
            onConfirm={handleClose}
            trigger={
              <Button variant="destructive" size="sm" className="w-full gap-2 text-xs justify-start">
                <ShieldCheck className="h-4 w-4" /> Close & Archive NCR
              </Button>
            }
          />
        )}
      </CardContent>
    </Card>
  );
}
