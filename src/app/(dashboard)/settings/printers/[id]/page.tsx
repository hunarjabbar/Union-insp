// FILE: src/app/(dashboard)/settings/printers/[id]/page.tsx
// STAGE: 9
// UPDATED: 2026-10-02
import * as React from 'react';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getAuthUser, requirePermission } from '@/lib/rbac';
import { prisma } from '@/lib/prisma';
import { listStations } from '@/actions/stations';
import { listAllLanes } from '@/actions/lanes';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PrinterForm } from '@/components/print/printer-form';
import { PairPrinterButton } from '@/components/print/pair-printer-button';
import { ArrowLeft, Printer, FileText, Calendar } from 'lucide-react';
import { formatDateTime, cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

interface PrinterDetailPageProps {
  params: { id: string };
}

export default async function PrinterDetailPage({ params }: PrinterDetailPageProps) {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  try {
    requirePermission(user, 'printer', 'read');
  } catch {
    redirect('/unauthorized');
  }

  // Load printer config by id directly with prisma
  const printer = await prisma.printerConfig.findUnique({
    where: { id: params.id },
    include: { station: true, lane: true },
  });

  if (!printer) {
    notFound();
  }

  const [stationsRes, lanesRes] = await Promise.all([
    listStations(),
    listAllLanes(),
  ]);

  const stations = stationsRes.ok ? stationsRes.data : [];
  const lanes = lanesRes.ok ? lanesRes.data : [];

  const status = printer.status?.toUpperCase() || 'UNPAIRED';
  let badgeStyle = 'bg-zinc-500/10 text-zinc-600 border-zinc-500/30';
  if (status === 'ONLINE') {
    badgeStyle = 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30';
  } else if (status === 'PAPER_OUT') {
    badgeStyle = 'bg-amber-500/10 text-amber-700 border-amber-500/30';
  } else if (status === 'ERROR') {
    badgeStyle = 'bg-red-500/10 text-red-700 border-red-500/30';
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
              <Link href="/settings/printers">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">{printer.name}</h1>
            <Badge variant="outline" className={cn('text-xs font-bold uppercase tracking-wider', badgeStyle)}>
              {status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground pl-10">
            Interface: <strong className="text-foreground uppercase">{printer.connectionType}</strong> · Format: <strong className="text-foreground">{printer.paperWidthMm}mm Roll</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <PairPrinterButton printerConfigId={printer.id} />
          <Button variant="outline" size="sm" asChild className="gap-2">
            <Link href="/settings/printers/test">
              <FileText className="h-4 w-4" /> Test Print
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Hardware Configuration Details</CardTitle>
            </CardHeader>
            <CardContent>
              <PrinterForm
                printer={printer as any}
                stations={stations}
                lanes={lanes}
                mode="edit"
              />
            </CardContent>
          </Card>
        </div>

        {/* Status card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Active Status Diagnostics</CardTitle>
            <CardDescription className="text-xs">Physical POS hardware responses.</CardDescription>
          </CardHeader>
          <CardContent className="text-xs space-y-3">
            <div className="border-b pb-2">
              <span className="text-muted-foreground block">USB Vendor Code:</span>
              <span className="font-mono text-foreground font-semibold">{printer.vendorId || 'N/A'}</span>
            </div>
            <div className="border-b pb-2">
              <span className="text-muted-foreground block">USB Product Code:</span>
              <span className="font-mono text-foreground font-semibold">{printer.productId || 'N/A'}</span>
            </div>
            <div className="border-b pb-2">
              <span className="text-muted-foreground block">Last Telemetry Check:</span>
              <span className="font-semibold text-foreground">
                {printer.lastSeenAt ? formatDateTime(new Date(printer.lastSeenAt)) : 'Never Reported'}
              </span>
            </div>
            {printer.lastError && (
              <div className="p-3 border border-red-500/20 bg-red-500/5 text-red-700 rounded-lg space-y-1">
                <span className="font-bold block">Last Device Error:</span>
                <p className="font-mono text-[10px] leading-relaxed">{printer.lastError}</p>
                <span className="text-[9px] text-muted-foreground block">
                  Logged: {printer.lastErrorAt ? formatDateTime(new Date(printer.lastErrorAt)) : 'N/A'}
                </span>
              </div>
            )}
            <div className="pt-1 flex items-center gap-1.5 text-muted-foreground text-[10px]">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> Registered: {formatDateTime(new Date(printer.createdAt))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
