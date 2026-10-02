// FILE: src/app/(dashboard)/stations/page.tsx
// STAGE: 9
// UPDATED: 2026-10-02
import * as React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAuthUser, requirePermission } from '@/lib/rbac';
import { listStations } from '@/actions/stations';
import { Button } from '@/components/ui/button';
import { StationTable } from '@/components/station/StationTable';

export const dynamic = 'force-dynamic';

export default async function StationsPage() {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  try {
    requirePermission(user, 'station', 'read');
  } catch {
    redirect('/unauthorized');
  }

  const result = await listStations();
  const rows = result.ok ? result.data : [];

  const isSuperAdmin = user.role === 'SUPER_ADMIN';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inspection Stations</h1>
          <p className="text-sm text-muted-foreground">
            Manage physical customs border terminals and urban traffic checkpoint infrastructure.
          </p>
        </div>
        {isSuperAdmin && (
          <Button asChild>
            <Link href="/stations/new">New Station</Link>
          </Button>
        )}
      </div>

      <StationTable rows={rows as any} />
    </div>
  );
}
