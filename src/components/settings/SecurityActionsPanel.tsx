// FILE: src/components/settings/SecurityActionsPanel.tsx
// STAGE: 14
// UPDATED: 2026-10-03
'use client';

import React, { useState, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, ShieldAlert, Laptop, Smartphone, Key, LogOut } from 'lucide-react';
import { toast } from 'sonner';

export interface SessionItem {
  id: string;
  userAgent?: string | null;
  ipAddress?: string | null;
  createdAt: string;
  lastSeenAt?: string | null;
  isCurrent: boolean;
}

interface SecurityActionsPanelProps {
  userId: string;
  mfaEnabled: boolean;
  lastLoginAt?: string | null;
  sessions: SessionItem[];
  onRevokeSession: (sessionId: string) => Promise<{ ok: boolean; error?: string }>;
  onRevokeAllSessions: () => Promise<{ ok: boolean; error?: string }>;
}

export function SecurityActionsPanel({
  mfaEnabled,
  lastLoginAt,
  sessions,
  onRevokeSession,
  onRevokeAllSessions,
}: SecurityActionsPanelProps) {
  const [sessionList, setSessionList] = useState<SessionItem[]>(sessions);
  const [isPending, startTransition] = useTransition();

  const handleRevokeSingle = (sessionId: string) => {
    startTransition(async () => {
      const res = await onRevokeSession(sessionId);
      if (res.ok) {
        setSessionList((prev) => prev.filter((s) => s.id !== sessionId));
        toast.success('Session revoked successfully');
      } else {
        toast.error(res.error || 'Failed to revoke session');
      }
    });
  };

  const handleRevokeAll = () => {
    startTransition(async () => {
      const res = await onRevokeAllSessions();
      if (res.ok) {
        setSessionList((prev) => prev.filter((s) => s.isCurrent));
        toast.success('All other sessions revoked');
      } else {
        toast.error(res.error || 'Failed to revoke other sessions');
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* MFA & Account Security State */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Key className="w-5 h-5 text-primary" />
                Multi-Factor Authentication (MFA)
              </CardTitle>
              <CardDescription>
                Two-factor authentication adds an extra layer of security to your terminal account.
              </CardDescription>
            </div>
            {mfaEnabled ? (
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 flex items-center gap-1.5 py-1 px-3">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                MFA Enforced
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 flex items-center gap-1.5 py-1 px-3">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                MFA Disabled
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            {lastLoginAt ? (
              <p>
                Last authenticated on: <span className="font-medium text-foreground">{new Date(lastLoginAt).toLocaleString()}</span>
              </p>
            ) : (
              <p>No prior login records found.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Active Sessions List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Active Terminal & Browser Sessions</CardTitle>
              <CardDescription>
                Review and terminate any active sessions connected to your inspection account.
              </CardDescription>
            </div>
            {sessionList.length > 1 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleRevokeAll}
                disabled={isPending}
                className="flex items-center gap-1.5"
              >
                <LogOut className="w-4 h-4" />
                Revoke All Others
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {sessionList.length === 0 ? (
            <div className="text-center py-6 text-sm text-muted-foreground">
              No other active sessions detected.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {sessionList.map((session) => (
                <div key={session.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-full text-muted-foreground">
                      {session.userAgent?.toLowerCase().includes('mobile') ? (
                        <Smartphone className="w-4 h-4" />
                      ) : (
                        <Laptop className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">
                          {session.userAgent || 'Web Browser / Terminal Client'}
                        </span>
                        {session.isCurrent && (
                          <Badge variant="secondary" className="text-xs">
                            Current Session
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        IP: {session.ipAddress || '127.0.0.1'} · Started:{' '}
                        {new Date(session.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {!session.isCurrent && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRevokeSingle(session.id)}
                      disabled={isPending}
                      className="text-xs"
                    >
                      Revoke
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
