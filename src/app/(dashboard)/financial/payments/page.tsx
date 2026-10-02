// FILE: src/app/(dashboard)/financial/payments/page.tsx
// STAGE: 10
// UPDATED: 2026-10-02
import * as React from 'react';
import { redirect } from 'next/navigation';
import { getAuthUser, requirePermission } from '@/lib/rbac';
import { listPayments } from '@/actions/payments';
import { PaymentsTable } from '@/components/financial/PaymentsTable';

export const dynamic = 'force-dynamic';

export default async function PaymentsPage() {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  try {
    requirePermission(user, 'payment', 'read');
  } catch {
    redirect('/unauthorized');
  }

  const result = await listPayments({});
  const payments = result.ok ? result.data : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Payments Ledger & Gateway Audit</h1>
        <p className="text-sm text-muted-foreground">
          Monitor real-time payment transactions across FastPay, ZainCash, FIB, QICard, and cash drawers.
        </p>
      </div>

      <PaymentsTable rows={payments as any} canRefund={user.role === 'SUPER_ADMIN'} />
    </div>
  );
}
