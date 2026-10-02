// FILE: src/app/(dashboard)/equipment/page.tsx
// STAGE: 9
// UPDATED: 2026-10-02
import * as React from 'react';
import { redirect } from 'next/navigation';
import { getAuthUser, requirePermission } from '@/lib/rbac';
import { listEquipment } from '@/actions/equipment';
import { listStations } from '@/actions/stations';
import { listAllLanes } from '@/actions/lanes';
import { EquipmentPageClient } from '@/components/equipment/EquipmentPageClient';

export const dynamic = 'force-dynamic';

export default async function EquipmentPage() {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  try {
    requirePermission(user, 'equipment', 'read');
  } catch {
    redirect('/unauthorized');
  }

  const [equipRes, stationsRes, lanesRes] = await Promise.all([
    listEquipment(),
    listStations(),
    listAllLanes(),
  ]);

  const equipment = equipRes.ok ? equipRes.data : [];
  const stations = stationsRes.ok ? stationsRes.data : [];
  const lanes = lanesRes.ok ? lanesRes.data : [];

  const isSuperAdmin = user.role === 'SUPER_ADMIN';
  const canCreate = ['SUPER_ADMIN', 'STATION_MANAGER'].includes(user.role);

  return (
    <EquipmentPageClient
      equipment={equipment as any}
      stations={stations}
      lanes={lanes}
      isSuperAdmin={isSuperAdmin}
      canCreate={canCreate}
    />
  );
}
