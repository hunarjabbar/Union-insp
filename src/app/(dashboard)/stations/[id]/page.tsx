// FILE: src/app/(dashboard)/stations/[id]/page.tsx
// STAGE: 9
// UPDATED: 2026-10-02
import * as React from 'react';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getAuthUser, requirePermission } from '@/lib/rbac';
import { getStationById } from '@/actions/stations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StationForm } from '@/components/station/StationForm';
import { Layers, Wrench, Printer, MapPin, Calendar } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

interface StationDetailPageProps {
  params: { id: string };
}

export default async function StationDetailPage({ params }: StationDetailPageProps) {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  const sRes = await getStationById(params.id);
  if (!sRes.ok || !sRes.data) {
    notFound();
  }

  const station = sRes.data;

  // Check if user has permission to update
  let canUpdate = false;
  try {
    requirePermission(user, 'station', 'update');
    canUpdate = true;
  } catch {
    canUpdate = false;
  }

  const lanes = station.lanes || [];
  const equipment = station.equipment || [];
  const printers = station.printerConfigs || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{station.name}</h1>
            <Badge variant="secondary" className="uppercase text-xs font-mono">
              {station.type.replace(/_/g, ' ')}
            </Badge>
            <Badge
              variant="outline"
              className={cn(
                'text-xs font-bold uppercase tracking-wider',
                station.isActive
                  ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30'
                  : 'bg-red-500/10 text-red-700 border-red-500/30'
              )}
            >
              {station.isActive ? 'Operational' : 'Inactive'}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 shrink-0" /> {station.address}
          </p>
        </div>
      </div>

      {/* Grid Layout: Playbook details, lists vs edit form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* LANES SECTION */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                Active Test Lanes ({lanes.length})
              </CardTitle>
              <Button size="sm" variant="ghost" asChild className="h-8 text-xs">
                <Link href="/lanes">Manage Lanes</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {lanes.length > 0 ? (
                <div className="divide-y text-xs">
                  {lanes.map((lane) => (
                    <div key={lane.id} className="flex items-center justify-between py-2.5">
                      <div>
                        <span className="font-semibold text-foreground text-sm">Lane #{lane.laneNumber}</span>
                        <span className="text-muted-foreground ml-2">({lane.name})</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-[10px] uppercase font-bold">
                          {lane.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-4">No lanes assigned to this station.</p>
              )}
            </CardContent>
          </Card>

          {/* EQUIPMENT SECTION */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Wrench className="h-4 w-4 text-amber-600" />
                Hardware Fleet & Diagnostic Equipment ({equipment.length})
              </CardTitle>
              <Button size="sm" variant="ghost" asChild className="h-8 text-xs">
                <Link href="/equipment">Manage Hardware</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {equipment.length > 0 ? (
                <div className="divide-y text-xs">
                  {equipment.map((eq) => (
                    <div key={eq.id} className="flex items-center justify-between py-2.5">
                      <div>
                        <span className="font-semibold text-foreground">{eq.name}</span>
                        <span className="text-muted-foreground ml-2">({eq.serialNumber})</span>
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        {eq.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-4">No diagnostic hardware configured.</p>
              )}
            </CardContent>
          </Card>

          {/* PRINTERS SECTION */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Printer className="h-4 w-4 text-blue-600" />
                POS ESC/POS Receipt Printers ({printers.length})
              </CardTitle>
              <Button size="sm" variant="ghost" asChild className="h-8 text-xs">
                <Link href="/settings/printers">Configure Printers</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {printers.length > 0 ? (
                <div className="divide-y text-xs">
                  {printers.map((pr) => (
                    <div key={pr.id} className="flex items-center justify-between py-2.5">
                      <div>
                        <span className="font-semibold text-foreground">{pr.name}</span>
                        <span className="text-muted-foreground ml-2">({pr.connectionType})</span>
                      </div>
                      <Badge variant="outline" className="text-[10px] font-bold">
                        {pr.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-4">No ticket printing hardware configured.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* EDIT FORM (OR READ METADATA) CARD */}
        <div>
          {canUpdate ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Modify Station Registry</CardTitle>
              </CardHeader>
              <CardContent>
                <StationForm station={station as any} mode="edit" />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Location Registry Details</CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-3">
                <div className="border-b pb-2">
                  <span className="text-muted-foreground block">English Registry Name:</span>
                  <span className="font-medium text-foreground">{station.name}</span>
                </div>
                <div className="border-b pb-2">
                  <span className="text-muted-foreground block">Kurdish (Sorani) Name:</span>
                  <span className="font-medium text-foreground">{station.nameKu ?? 'N/A'}</span>
                </div>
                <div className="border-b pb-2">
                  <span className="text-muted-foreground block">Arabic Name:</span>
                  <span className="font-medium text-foreground">{station.nameAr ?? 'N/A'}</span>
                </div>
                <div className="border-b pb-2">
                  <span className="text-muted-foreground block">Physical Boundary coordinates:</span>
                  <span className="font-mono text-foreground">{station.latitude}, {station.longitude}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Audit Created:</span>
                  <span className="text-muted-foreground flex items-center gap-1 mt-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(new Date(station.createdAt))}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

import { cn } from '@/lib/utils';
