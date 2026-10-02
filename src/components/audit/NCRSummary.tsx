// FILE: src/components/audit/NCRSummary.tsx
// STAGE: 10
// UPDATED: 2026-10-02
import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/shared/EmptyState';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import { formatDate, cn } from '@/lib/utils';
import { NcrSeverityBadge } from './NcrStatusBadge';

export interface NcrSummaryRow {
  id: string;
  ncrNumber: string;
  title: string;
  severity: string;
  status: string;
  dueDate: Date | string | null;
  creator: { fullName: string };
}

export interface NCRSummaryProps {
  ncrs: NcrSummaryRow[];
}

export function NCRSummary({ ncrs }: NCRSummaryProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          Open Non-Conformities
        </CardTitle>
        <Badge variant="secondary" className="text-xs">
          {ncrs.length} Active
        </Badge>
      </CardHeader>
      <CardContent>
        {ncrs.length === 0 ? (
          <EmptyState
            icon={CheckCircle}
            title="No open NCRs"
            description="All ISO non-conformities are successfully resolved."
          />
        ) : (
          <ul className="divide-y text-xs space-y-3">
            {ncrs.map((ncr) => (
              <li key={ncr.id} className="pt-3 first:pt-0">
                <Link
                  href={`/audit/ncr/${ncr.id}`}
                  className="block group space-y-1.5 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <NcrSeverityBadge severity={ncr.severity} />
                    <span className="font-mono text-xs font-semibold text-muted-foreground">
                      {ncr.ncrNumber}
                    </span>
                  </div>
                  <p className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">
                    {ncr.title}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                    <span>Assigned: {ncr.creator.fullName}</span>
                    <span>Due: {ncr.dueDate ? formatDate(ncr.dueDate) : 'No due date'}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
