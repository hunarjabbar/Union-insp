// FILE: src/app/(dashboard)/audit/ncr/[id]/page.tsx
// STAGE: 10
// UPDATED: 2026-10-02
import * as React from 'react';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getAuthUser, requirePermission } from '@/lib/rbac';
import { getNcrById } from '@/actions/ncrs';
import { listUsers } from '@/actions/users';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { NcrSeverityBadge, NcrStatusBadge } from '@/components/audit/NcrStatusBadge';
import { formatDate } from '@/lib/utils';
import { ArrowLeft, FileText, Wrench } from 'lucide-react';
import { NcrDetailActions } from '@/components/audit/NcrDetailActions';

export const dynamic = 'force-dynamic';

interface NcrDetailPageProps {
  params: { id: string };
}

export default async function NcrDetailPage({ params }: NcrDetailPageProps) {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  try {
    requirePermission(user, 'ncr', 'read');
  } catch {
    redirect('/unauthorized');
  }

  const [ncrRes, usersRes] = await Promise.all([
    getNcrById(params.id),
    listUsers(),
  ]);

  if (!ncrRes.ok || !ncrRes.data) {
    notFound();
  }

  const ncr = ncrRes.data;
  const users = usersRes.ok ? usersRes.data : [];

  let canUpdate = false;
  let canClose = false;
  try {
    requirePermission(user, 'ncr', 'update');
    canUpdate = true;
  } catch {
    canUpdate = false;
  }
  if (['SUPER_ADMIN', 'COMPLIANCE_AUDITOR'].includes(user.role)) {
    canClose = true;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
              <Link href="/audit/ncr">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-2xl font-bold tracking-tight font-mono">{ncr.ncrNumber}</h1>
            <NcrSeverityBadge severity={ncr.severity} />
            <NcrStatusBadge status={ncr.status} />
          </div>
          <p className="text-sm text-muted-foreground pl-11">
            Standard: <span className="font-semibold text-foreground">{ncr.isoStandard ?? 'ISO_17020'}</span> · Raised on {formatDate(ncr.createdAt)}
          </p>
        </div>
      </div>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Title & Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Non-Conformity Findings & Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div>
                <span className="text-muted-foreground block font-semibold mb-1">Title:</span>
                <p className="text-sm font-medium text-foreground">{ncr.title ?? 'Untitled Non-Conformity'}</p>
              </div>
              <div className="border-t pt-3">
                <span className="text-muted-foreground block font-semibold mb-1">Detailed Description:</span>
                <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{ncr.description}</p>
              </div>
            </CardContent>
          </Card>

          {/* Investigation & Corrective Action */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Wrench className="h-4 w-4 text-amber-600" />
                Corrective Action & Investigation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              {ncr.status === 'OPEN' || !ncr.correctiveAction ? (
                <p className="text-muted-foreground italic py-4 text-center">
                  Investigation pending or corrective action not yet submitted.
                </p>
              ) : (
                <div className="space-y-3">
                  <div className="border-b pb-2">
                    <span className="text-muted-foreground block font-semibold">Corrective Action Implemented:</span>
                    <p className="text-foreground mt-0.5">{ncr.correctiveAction ?? 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground block font-semibold">Preventive Measures:</span>
                    <p className="text-foreground mt-0.5">{ncr.preventiveAction ?? 'N/A'}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Actions & Metadata */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Metadata & Ownership</CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-3">
              <div className="border-b pb-2">
                <span className="text-muted-foreground block">Raised By:</span>
                <span className="font-semibold text-foreground">{ncr.raisedBy?.fullName ?? 'System'}</span>
              </div>
              <div className="border-b pb-2">
                <span className="text-muted-foreground block">Assigned Operator ID:</span>
                <span className="font-semibold text-foreground">{ncr.assignedTo ?? 'Unassigned'}</span>
              </div>
              <div className="border-b pb-2">
                <span className="text-muted-foreground block">Due Date:</span>
                <span className="font-semibold text-foreground">{ncr.dueDate ? formatDate(ncr.dueDate) : 'No due date'}</span>
              </div>
              {ncr.inspectionId && (
                <div>
                  <span className="text-muted-foreground block">Related Inspection:</span>
                  <Link href={`/inspection/${ncr.inspectionId}`} className="text-primary hover:underline font-mono">
                    View Inspection Record →
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {(canUpdate || canClose) && (
            <NcrDetailActions ncrId={ncr.id} currentStatus={ncr.status} users={users} canClose={canClose} />
          )}
        </div>
      </div>
    </div>
  );
}
