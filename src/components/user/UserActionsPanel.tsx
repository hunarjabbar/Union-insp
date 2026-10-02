// FILE: src/components/user/UserActionsPanel.tsx
// STAGE: 9
// UPDATED: 2026-10-02
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ShieldAlert, ShieldX, KeyRound, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { RoleChangeDialog } from './RoleChangeDialog';
import { suspendUser, reactivateUser, revokeAllSessions } from '@/actions/users';
import type { Role } from '@prisma/client';

export interface UserActionsPanelProps {
  userId: string;
  status: string;
  currentRole: Role;
}

export function UserActionsPanel({ userId, status, currentRole }: UserActionsPanelProps) {
  const router = useRouter();

  async function handleSuspend() {
    try {
      const res = await suspendUser(userId);
      if (res.ok) {
        toast.success('Personnel access has been suspended and sessions revoked');
        router.refresh();
      } else {
        toast.error(res.error || 'Failed to suspend user');
      }
    } catch {
      toast.error('Unexpected error while suspending.');
    }
  }

  async function handleReactivate() {
    try {
      const res = await reactivateUser(userId);
      if (res.ok) {
        toast.success('Personnel access has been successfully restored');
        router.refresh();
      } else {
        toast.error(res.error || 'Failed to restore access');
      }
    } catch {
      toast.error('Unexpected error while restoring access.');
    }
  }

  async function handleRevokeAll() {
    try {
      const res = await revokeAllSessions(userId);
      if (res.ok) {
        toast.success('All active browser sessions have been immediately revoked');
        router.refresh();
      } else {
        toast.error(res.error || 'Failed to revoke sessions');
      }
    } catch {
      toast.error('Unexpected error while revoking sessions.');
    }
  }

  const isSuspended = status === 'SUSPENDED';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Security Command Center</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Escalate role */}
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Authority Management</span>
          <div className="pt-1">
            <RoleChangeDialog userId={userId} currentRole={currentRole} />
          </div>
        </div>

        {/* Suspend or Reactivate */}
        <div className="flex flex-col gap-1 pt-2 border-t">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Access & Authentication</span>
          <div className="flex flex-wrap gap-2 pt-1.5">
            {isSuspended ? (
              <ConfirmDialog
                title="Restore Personnel Access?"
                description="Are you sure you want to restore system access for this user? They will be able to sign in and log diagnostics immediately."
                confirmLabel="Reactivate Account"
                onConfirm={handleReactivate}
                trigger={
                  <Button variant="outline" size="sm" className="gap-2 border-emerald-500/40 text-emerald-700 hover:bg-emerald-500/10">
                    <CheckCircle2 className="h-4 w-4" /> Restore Access
                  </Button>
                }
              />
            ) : (
              <ConfirmDialog
                title="Suspend Personnel Access?"
                description="Warning: Suspending this user immediately terminates all active web sessions, deactivates authentication, and restricts them from logging inspections. Are you sure?"
                confirmLabel="Suspend Account"
                variant="destructive"
                onConfirm={handleSuspend}
                trigger={
                  <Button variant="destructive" size="sm" className="gap-2">
                    <ShieldX className="h-4 w-4" /> Suspend Personnel
                  </Button>
                }
              />
            )}

            <ConfirmDialog
              title="Revoke All Live Sessions?"
              description="This will immediately invalidate and purge all current browser sessions and cookies for this user, forcing them to sign in again. Continue?"
              confirmLabel="Revoke Sessions"
              variant="destructive"
              onConfirm={handleRevokeAll}
              trigger={
                <Button variant="outline" size="sm" className="gap-2 text-red-600 hover:bg-red-50 hover:text-red-700">
                  <KeyRound className="h-4 w-4" /> Kill Active Sessions
                </Button>
              }
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
