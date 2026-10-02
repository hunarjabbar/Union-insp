// FILE: src/app/(dashboard)/audit/ncr/page.tsx
// STAGE: 10
// UPDATED: 2026-10-02
import * as React from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getAuthUser, requirePermission } from '@/lib/rbac';
import { listNcrs } from '@/actions/ncrs';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { NcrTable } from '@/components/audit/NcrTable';
import { NcrForm } from '@/components/audit/NcrForm';

export const dynamic = 'force-dynamic';

interface NcrPageProps {
  searchParams: { status?: string };
}

export default async function NcrListPage({ searchParams }: NcrPageProps) {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  try {
    requirePermission(user, 'ncr', 'read');
  } catch {
    redirect('/unauthorized');
  }

  const statusFilter = searchParams.status && searchParams.status !== 'ALL' ? searchParams.status : undefined;
  const result = await listNcrs({ status: statusFilter });
  const rows = result.ok ? result.data : [];

  const canCreate = true;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Non-Conformity Reports (NCR)</h1>
          <p className="text-sm text-muted-foreground">
            ISO audit findings, corrective action assignments, and compliance remediation logs.
          </p>
        </div>

        {canCreate && (
          <Dialog>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> New NCR Report
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Generate New Non-Conformity Report</DialogTitle>
              </DialogHeader>
              <NcrForm onClose={() => {}} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {['ALL', 'OPEN', 'INVESTIGATING', 'CORRECTIVE_ACTION_ASSIGNED', 'RESOLVED', 'CLOSED'].map((st) => {
          const active = (searchParams.status ?? 'ALL') === st;
          return (
            <Link
              key={st}
              href={`/audit/ncr${st === 'ALL' ? '' : `?status=${st}`}`}
              className={`px-3 py-1.5 font-medium rounded-md transition-colors whitespace-nowrap ${
                active
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
              }`}
            >
              {st.replace(/_/g, ' ')}
            </Link>
          );
        })}
      </div>

      <NcrTable rows={rows as any} />
    </div>
  );
}
