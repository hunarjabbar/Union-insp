// FILE: src/app/(dashboard)/inspection/new/page.tsx
// STAGE: 8
// UPDATED: 2026-10-02
import { redirect } from 'next/navigation';
import { getAuthUser, requirePermission } from '@/lib/rbac';
import { prisma } from '@/lib/prisma';
import { InspectionWizard } from '@/components/inspection/InspectionWizard';

export const dynamic = 'force-dynamic';

export default async function NewInspectionPage() {
  const user = await getAuthUser();
  if (!user) redirect('/login');
  try {
    requirePermission(user, 'inspection', 'create');
  } catch {
    redirect('/unauthorized');
  }

  const [stations, lanes] = await Promise.all([
    prisma.station.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    }),
    prisma.lane.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { laneNumber: 'asc' },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">New Vehicle Inspection</h1>
        <p className="text-sm text-muted-foreground">
          Step-by-step workflow for ISO compliance verification, fee collection, and digital issuance.
        </p>
      </div>

      <InspectionWizard stations={stations} lanes={lanes} />
    </div>
  );
}
