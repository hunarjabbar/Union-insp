// FILE: src/app/(dashboard)/lanes/page.tsx
// STAGE: 9
// UPDATED: 2026-10-02
import * as React from 'react';
import { redirect } from 'next/navigation';
import { getAuthUser, requirePermission } from '@/lib/rbac';
import { listAllLanes } from '@/actions/lanes';
import { listStations } from '@/actions/stations';
import { StationLanesGroup } from '@/components/lane/StationLanesGroup';

export const dynamic = 'force-dynamic';

export default async function LanesPage() {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  try {
    requirePermission(user, 'lane', 'read');
  } catch {
    redirect('/unauthorized');
  }

  const [allLanesRes, stationsRes] = await Promise.all([
    listAllLanes(),
    listStations(),
  ]);

  const allLanes = allLanesRes.ok ? allLanesRes.data : [];
  const stations = stationsRes.ok ? stationsRes.data : [];

  const isSuperAdmin = user.role === 'SUPER_ADMIN';
  const canCreate = ['SUPER_ADMIN', 'STATION_MANAGER'].includes(user.role);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Station Testing Lanes</h1>
        <p className="text-sm text-muted-foreground">
          Deploy physical diagnostic paths, assign equipment calibrators, and manage lane operational cycles.
        </p>
      </div>

      <div className="space-y-6">
        {stations.map((station) => {
          const lanesForStation = allLanes.filter((lane) => lane.stationId === station.id);
          return (
            <StationLanesGroup
              key={station.id}
              station={station}
              lanes={lanesForStation as any}
              canCreate={canCreate}
              isSuperAdmin={isSuperAdmin}
            />
          );
        })}

        {stations.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-12 border rounded-xl bg-card">
            No stations established in the registry. Establish stations first.
          </p>
        )}
      </div>
    </div>
  );
}
