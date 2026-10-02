// FILE: src/app/(dashboard)/vehicles/page.tsx
// STAGE: 9
// UPDATED: 2026-10-02
import * as React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAuthUser, requirePermission } from '@/lib/rbac';
import { listVehicles } from '@/actions/vehicles';
import { Button } from '@/components/ui/button';
import { VehicleTable } from '@/components/vehicle/VehicleTable';

export const dynamic = 'force-dynamic';

export default async function VehiclesPage() {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  try {
    requirePermission(user, 'vehicle', 'read');
  } catch {
    redirect('/unauthorized');
  }

  const result = await listVehicles({ page: 1, pageSize: 50 });
  const rows = result.ok ? result.data.rows : [];

  const canCreate = ['SUPER_ADMIN', 'STATION_MANAGER', 'LEAD_INSPECTOR'].includes(user.role);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Registered Vehicles</h1>
          <p className="text-sm text-muted-foreground">
            Manage heavy freight, intercity tour buses, and light commercial vehicles in the system.
          </p>
        </div>
        {canCreate && (
          <Button asChild>
            <Link href="/vehicles/new">New Vehicle</Link>
          </Button>
        )}
      </div>

      <VehicleTable rows={rows as any} />
    </div>
  );
}
