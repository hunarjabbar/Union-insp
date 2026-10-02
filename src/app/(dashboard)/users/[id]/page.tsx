// FILE: src/app/(dashboard)/users/[id]/page.tsx
// STAGE: 9
// UPDATED: 2026-10-02
import * as React from 'react';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getAuthUser, requireRole } from '@/lib/rbac';
import { getUserById } from '@/actions/users';
import { listStations } from '@/actions/stations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UserForm } from '@/components/user/UserForm';
import { UserActionsPanel } from '@/components/user/UserActionsPanel';
import { formatDateTime, cn } from '@/lib/utils';
import { ShieldCheck, ShieldAlert, ArrowLeft, Mail, Calendar, Key } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface UserDetailPageProps {
  params: { id: string };
}

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  try {
    requireRole(user, ['SUPER_ADMIN']);
  } catch {
    redirect('/unauthorized');
  }

  const [targetUserRes, stationsRes] = await Promise.all([
    getUserById(params.id),
    listStations(),
  ]);

  if (!targetUserRes.ok || !targetUserRes.data) {
    notFound();
  }

  const targetUser = targetUserRes.data;
  const stations = stationsRes.ok ? stationsRes.data : [];

  const isSuspended = targetUser.status === 'SUSPENDED';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
              <Link href="/users">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">{targetUser.fullName}</h1>
            <Badge
              variant="outline"
              className={cn(
                'text-xs font-bold uppercase tracking-wider',
                isSuspended
                  ? 'bg-red-500/10 text-red-700 border-red-500/30'
                  : 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30'
              )}
            >
              {targetUser.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5 pl-10">
            <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> {targetUser.email}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details and edit form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Representative Core Attributes</CardTitle>
            </CardHeader>
            <CardContent>
              <UserForm user={targetUser as any} stations={stations} mode="edit" />
            </CardContent>
          </Card>
        </div>

        {/* Security Command Panel */}
        <div className="space-y-6">
          <UserActionsPanel
            userId={targetUser.id}
            status={targetUser.status}
            currentRole={targetUser.role}
          />

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Access Profile Audit Log</CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-3">
              <div className="border-b pb-2 flex justify-between items-center">
                <span className="text-muted-foreground">Force Multi-Factor:</span>
                <Badge variant={targetUser.mfaEnabled ? 'default' : 'secondary'} className="text-[10px]">
                  {targetUser.mfaEnabled ? 'ENABLED' : 'DISABLED'}
                </Badge>
              </div>
              <div className="border-b pb-2 flex justify-between items-center">
                <span className="text-muted-foreground">Last Auth Signal:</span>
                <span className="font-semibold text-foreground">
                  {targetUser.lastLoginAt ? formatDateTime(new Date(targetUser.lastLoginAt)) : 'Never'}
                </span>
              </div>
              <div className="pb-1 flex justify-between items-center">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" /> Registry Established:
                </span>
                <span className="font-medium text-foreground">
                  {formatDateTime(new Date(targetUser.createdAt))}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
