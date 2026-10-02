// FILE: src/components/user/RoleChangeDialog.tsx
// STAGE: 9
// UPDATED: 2026-10-02
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ShieldAlert, Loader2 } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { changeUserRole } from '@/actions/users';
import type { Role } from '@prisma/client';
import { cn } from '@/lib/utils';

export interface RoleChangeDialogProps {
  userId: string;
  currentRole: Role;
}

const ROLES = [
  { value: 'SUPER_ADMIN', label: 'Super Administrator' },
  { value: 'STATION_MANAGER', label: 'Station Manager' },
  { value: 'LEAD_INSPECTOR', label: 'Lead Inspector' },
  { value: 'COMPLIANCE_AUDITOR', label: 'Compliance Auditor' },
  { value: 'SYNDICATE_REPRESENTATIVE', label: 'Syndicate Representative' },
  { value: 'INSPECTION_TECHNICIAN', label: 'Inspection Technician' },
  { value: 'CASHIER', label: 'Cashier' },
];

export function RoleChangeDialog({ userId, currentRole }: RoleChangeDialogProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [selectedRole, setSelectedRole] = React.useState<Role>(currentRole);
  const [reason, setReason] = React.useState('');

  const isReasonValid = reason.trim().length >= 10;
  const isChanged = selectedRole !== currentRole;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isChanged) {
      toast.error('Please select a different role to change');
      return;
    }
    if (!isReasonValid) {
      toast.error('Justification reason must contain at least 10 characters');
      return;
    }

    setPending(true);
    try {
      const res = await changeUserRole({
        id: userId,
        role: selectedRole,
      });

      if (res.ok) {
        toast.success(`User role successfully escalated to ${selectedRole}`);
        setOpen(false);
        setReason('');
        router.refresh();
      } else {
        toast.error(res.error || 'Failed to update user role');
      }
    } catch {
      toast.error('An unexpected error occurred while shifting role.');
    } finally {
      setPending(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 border-purple-500/40 text-purple-700 hover:bg-purple-500/10">
          <ShieldAlert className="h-4 w-4" /> Escalate / Change Role
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <AlertDialogHeader>
            <AlertDialogTitle>Escalate Personnel Role</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Warning: Changing a role will immediately revoke all active browser sessions for this user. They must sign in again with escalated authority.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-3 text-xs">
            {/* Role Select */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Select Target Authorization Role</Label>
              <Select
                value={selectedRole}
                onValueChange={(val: Role) => setSelectedRole(val)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Reason justification */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label className="text-xs font-semibold">Technical / Operational Reason</Label>
                <span className={cn('text-[10px]', isReasonValid ? 'text-muted-foreground' : 'text-amber-600 font-bold')}>
                  {reason.length}/10 chars min
                </span>
              </div>
              <Textarea
                placeholder="e.g. Authorized transfer to Erbil Customs Station as Lead Inspector."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="min-h-[80px]"
                required
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <Button
              type="submit"
              disabled={pending || !isReasonValid || !isChanged}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {pending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Escolating...
                </span>
              ) : (
                'Confirm Escalation'
              )}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
