// FILE: src/app/(dashboard)/audit/page.tsx
// STAGE: 10
// UPDATED: 2026-10-02
import * as React from 'react';
import { redirect } from 'next/navigation';
import { getAuthUser, requirePermission } from '@/lib/rbac';
import { verifyAuditChain, listAuditLogs } from '@/actions/audit';
import { listNcrs } from '@/actions/ncrs';
import { prisma } from '@/lib/prisma';
import { HashChainVerifier } from '@/components/audit/HashChainVerifier';
import { AuditLogTable } from '@/components/audit/AuditLogTable';
import { NCRSummary } from '@/components/audit/NCRSummary';
import { CalibrationStatusGrid } from '@/components/audit/CalibrationStatusGrid';

export const dynamic = 'force-dynamic';

export default async function AuditPortalPage() {
  const user = await getAuthUser();
  if (!user) redirect('/login');
  try {
    requirePermission(user, 'auditLog', 'read');
  } catch {
    redirect('/unauthorized');
  }

  const [chainResult, logsResult, ncrsResult, equipment] = await Promise.all([
    verifyAuditChain(),
    listAuditLogs({ page: 1, pageSize: 50 }),
    listNcrs({ status: 'OPEN' }),
    prisma.equipment.findMany({
      orderBy: { calibrationDue: 'asc' },
      include: { station: { select: { name: true } } },
      take: 20,
    }),
  ]);

  const chain = chainResult.ok
    ? chainResult.data
    : { valid: false, totalEntries: 0, violations: ['Failed to load audit chain'] };
  const logs = logsResult.ok ? logsResult.data.rows : [];
  const ncrs = ncrsResult.ok ? ncrsResult.data : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">ISO Audit Portal</h1>
          <p className="text-sm text-muted-foreground">
            Read-only compliance oversight — ISO/IEC 17020, ISO 27001, ISO 9001, ISO 39001
          </p>
        </div>
        <HashChainVerifier
          valid={chain.valid}
          totalEntries={chain.totalEntries}
          violations={chain.violations}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AuditLogTable rows={logs as any} />
        </div>
        <div className="space-y-6">
          <NCRSummary ncrs={ncrs as any} />
          <CalibrationStatusGrid equipment={equipment as any} />
        </div>
      </div>
    </div>
  );
}
