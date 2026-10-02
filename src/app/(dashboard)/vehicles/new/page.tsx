// FILE: src/app/(dashboard)/vehicles/new/page.tsx
// STAGE: 9
// UPDATED: 2026-10-02
import * as React from 'react';
import { redirect } from 'next/navigation';
import { getAuthUser, requirePermission } from '@/lib/rbac';
import { listFleetOwners } from '@/actions/vehicles';
import { listStations } from '@/actions/stations';
import { VehicleForm } from '@/components/vehicle/VehicleForm';

export const dynamic = 'force-dynamic';

export default async function NewVehiclePage() {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  try {
    requirePermission(user, 'vehicle', 'create');
  } catch {
    redirect('/unauthorized');
  }

  const [fleetOwners, stationsRes] = await Promise.all([
    listFleetOwners(),
    listStations(),
  ]);

  const stations = stationsRes.ok ? stationsRes.data : [];

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Register New Vehicle</h1>
        <p className="text-sm text-muted-foreground">
          Identify safety parameters and registration metadata before proceeding with optical and mechanical lane checks.
        </p>
      </div>

      <VehicleForm fleetOwners={fleetOwners} stations={stations} mode="create" />
    </div>
  );
}
