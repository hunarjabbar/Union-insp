// FILE: src/app/(dashboard)/settings/printers/page.tsx
// STAGE: 9
// UPDATED: 2026-10-02
import * as React from 'react';
import { redirect } from 'next/navigation';
import { getAuthUser, requirePermission } from '@/lib/rbac';
import { listPrinterConfigs } from '@/actions/printers';
import { listStations } from '@/actions/stations';
import { listAllLanes } from '@/actions/lanes';
import { PrintersPageClient } from '@/components/print/PrintersPageClient';

export const dynamic = 'force-dynamic';

export default async function PrintersPage() {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  try {
    requirePermission(user, 'printer', 'read');
  } catch {
    redirect('/unauthorized');
  }

  // Load printers (filter by user.stationId if they are not super admin)
  const stationId = user.role === 'SUPER_ADMIN' ? undefined : (user.stationId ?? undefined);
  const [printersRes, stationsRes, lanesRes] = await Promise.all([
    listPrinterConfigs(stationId),
    listStations(),
    listAllLanes(),
  ]);

  const printers = printersRes.ok ? printersRes.data : [];
  const stations = stationsRes.ok ? stationsRes.data : [];
  const lanes = lanesRes.ok ? lanesRes.data : [];

  const isSuperAdmin = user.role === 'SUPER_ADMIN';
  const canCreate = ['SUPER_ADMIN', 'STATION_MANAGER'].includes(user.role);

  return (
    <PrintersPageClient
      printers={printers as any}
      stations={stations}
      lanes={lanes}
      isSuperAdmin={isSuperAdmin}
      canCreate={canCreate}
    />
  );
}
