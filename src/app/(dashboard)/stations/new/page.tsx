// FILE: src/app/(dashboard)/stations/new/page.tsx
// STAGE: 9
// UPDATED: 2026-10-02
import * as React from 'react';
import { redirect } from 'next/navigation';
import { getAuthUser, requirePermission } from '@/lib/rbac';
import { StationForm } from '@/components/station/StationForm';

export const dynamic = 'force-dynamic';

export default async function NewStationPage() {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  try {
    requirePermission(user, 'station', 'create');
  } catch {
    redirect('/unauthorized');
  }

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Establish New Station</h1>
        <p className="text-sm text-muted-foreground">
          Deploy physical infrastructure specifications, custom GPS boundaries, and operational classifications.
        </p>
      </div>

      <StationForm mode="create" />
    </div>
  );
}
