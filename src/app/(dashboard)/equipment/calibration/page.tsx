// FILE: src/app/(dashboard)/equipment/calibration/page.tsx
// STAGE: 9
// UPDATED: 2026-10-02
import * as React from 'react';
import { redirect } from 'next/navigation';
import { getAuthUser, requirePermission } from '@/lib/rbac';
import { prisma } from '@/lib/prisma';
import { CalibrationBoardClient } from '@/components/equipment/CalibrationBoardClient';

export const dynamic = 'force-dynamic';

export default async function CalibrationBoardPage() {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  try {
    requirePermission(user, 'equipment', 'read');
  } catch {
    redirect('/unauthorized');
  }

  // Load all equipment with latest calibrationLog and station / lane details
  const equipment = await prisma.equipment.findMany({
    orderBy: { calibrationDue: 'asc' },
    include: {
      station: { select: { name: true } },
      lane: { select: { name: true } },
      calibrationLogs: {
        orderBy: { calibratedAt: 'desc' },
        take: 1,
      },
    },
  });

  return (
    <CalibrationBoardClient equipment={equipment as any} />
  );
}
