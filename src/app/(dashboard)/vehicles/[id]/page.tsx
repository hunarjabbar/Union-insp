// FILE: src/app/(dashboard)/vehicles/[id]/page.tsx
// STAGE: 9
// UPDATED: 2026-10-02
import * as React from 'react';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getAuthUser } from '@/lib/rbac';
import { getVehicleById, listFleetOwners } from '@/actions/vehicles';
import { listStations } from '@/actions/stations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { VehicleForm } from '@/components/vehicle/VehicleForm';
import { DeleteVehicleButton } from '@/components/vehicle/DeleteVehicleButton';
import { VehicleStatusBadge } from '@/components/vehicle/VehicleStatusBadge';
import { formatDate, formatDateTime, cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

interface VehicleDetailPageProps {
  params: { id: string };
}

export default async function VehicleDetailPage({ params }: VehicleDetailPageProps) {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  const [vehicleRes, fleetOwners, stationsRes] = await Promise.all([
    getVehicleById(params.id),
    listFleetOwners(),
    listStations(),
  ]);

  if (!vehicleRes.ok || !vehicleRes.data) {
    notFound();
  }

  const vehicle = vehicleRes.data;
  const stations = stationsRes.ok ? stationsRes.data : [];

  const isSuperAdmin = user.role === 'SUPER_ADMIN';

  // Find last inspection
  const inspections = vehicle.inspections || [];
  const lastInspection = inspections[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              {vehicle.plateNumber}
            </h1>
            <VehicleStatusBadge score={vehicle.complianceScore} />
          </div>
          <p className="text-sm text-muted-foreground">
            Manufacturer registry & core compliance indicators.
          </p>
        </div>

        {isSuperAdmin && (
          <div className="flex items-center gap-2">
            <DeleteVehicleButton vehicleId={vehicle.id} />
          </div>
        )}
      </div>

      {/* Grid Specs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Vehicle Metadata Specs</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-xs">
            <div className="border-b pb-2">
              <span className="text-muted-foreground block">Chassis VIN:</span>
              <span className="font-mono font-medium text-foreground">{vehicle.vin ?? 'N/A'}</span>
            </div>
            <div className="border-b pb-2">
              <span className="text-muted-foreground block">Classification:</span>
              <span className="font-medium text-foreground capitalize">{vehicle.category.replace(/_/g, ' ').toLowerCase()}</span>
            </div>
            <div className="border-b pb-2">
              <span className="text-muted-foreground block">Make / Model:</span>
              <span className="font-medium text-foreground">
                {vehicle.make || vehicle.model ? `${vehicle.make ?? ''} ${vehicle.model ?? ''}`.trim() : 'N/A'}
              </span>
            </div>
            <div className="border-b pb-2">
              <span className="text-muted-foreground block">Manufacturing Year:</span>
              <span className="font-medium text-foreground">{vehicle.year ?? 'N/A'}</span>
            </div>
            <div className="border-b pb-2">
              <span className="text-muted-foreground block">Gross Weight:</span>
              <span className="font-medium text-foreground">
                {vehicle.grossWeightKg ? `${vehicle.grossWeightKg.toLocaleString()} kg` : 'N/A'}
              </span>
            </div>
            <div className="border-b pb-2">
              <span className="text-muted-foreground block">Fleet Owner:</span>
              <span className="font-medium text-foreground">
                {vehicle.fleetOwner?.companyName ?? 'Private / Individual'}
              </span>
            </div>
            <div className="border-b pb-2">
              <span className="text-muted-foreground block">Registered Station:</span>
              <span className="font-medium text-foreground">{vehicle.station?.name ?? 'National Registry'}</span>
            </div>
            <div className="border-b pb-2">
              <span className="text-muted-foreground block">Last Inspection Date:</span>
              <span className="font-medium text-foreground">
                {lastInspection ? formatDate(new Date(lastInspection.createdAt)) : 'No Inspections Recorded'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Update Specifications</CardTitle>
          </CardHeader>
          <CardContent>
            <VehicleForm
              vehicle={vehicle as any}
              fleetOwners={fleetOwners}
              stations={stations}
              mode="edit"
            />
          </CardContent>
        </Card>
      </div>

      {/* Recent Inspections List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Inspection Log History</CardTitle>
        </CardHeader>
        <CardContent>
          {inspections.length > 0 ? (
            <div className="divide-y text-xs">
              {inspections.map((ins) => {
                const res = (ins.overallResult || ins.status).toUpperCase();
                let badgeStyle = 'bg-zinc-500/10 text-zinc-600 border-zinc-500/30';
                if (res === 'PASSED' || res === 'PASS') {
                  badgeStyle = 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-400';
                } else if (res === 'CONDITIONAL_PASS') {
                  badgeStyle = 'bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-400';
                } else if (res === 'FAILED' || res === 'FAIL') {
                  badgeStyle = 'bg-red-500/10 text-red-700 border-red-500/30 dark:text-red-400';
                }

                return (
                  <div key={ins.id} className="flex items-center justify-between py-2.5">
                    <div className="space-y-0.5">
                      <Link
                        href={`/inspection/${ins.id}`}
                        className="font-mono font-semibold text-primary hover:underline text-sm"
                      >
                        {ins.inspectionCode}
                      </Link>
                      <div className="text-muted-foreground text-[11px]">
                        Issued on {formatDateTime(new Date(ins.createdAt))}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className={cn('font-medium', badgeStyle)}>
                        {res.replace(/_/g, ' ')}
                      </Badge>
                      <Button variant="ghost" size="sm" asChild className="h-7 text-xs">
                        <Link href={`/inspection/${ins.id}`}>Details</Link>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-6">
              No inspections recorded for this vehicle.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
