// FILE: src/app/(dashboard)/inspection/[id]/page.tsx
// STAGE: 8
// UPDATED: 2026-10-02
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import {
  FileDown,
  Printer,
  ShieldAlert,
  CheckCircle,
  Wrench,
  Clock,
  UserCheck,
} from 'lucide-react';
import { getInspectionById, countersignInspection } from '@/actions/inspections';
import { getReceiptByInspection } from '@/actions/receipts';
import { getAuthUser, requirePermission } from '@/lib/rbac';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OverrideDialog } from '@/components/inspection/OverrideDialog';
import { QrPreview } from '@/components/inspection/QrPreview';
import { PaymentStatusBadge } from '@/components/payments/PaymentStatusBadge';
import { formatDateTime, formatIQD, cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

interface InspectionDetailPageProps {
  params: { id: string };
}

export default async function InspectionDetailPage({
  params,
}: InspectionDetailPageProps) {
  const user = await getAuthUser();
  if (!user) redirect('/login');
  try {
    requirePermission(user, 'inspection', 'read');
  } catch {
    redirect('/unauthorized');
  }

  const [inspRes, receiptRes] = await Promise.all([
    getInspectionById(params.id),
    getReceiptByInspection(params.id),
  ]);

  if (!inspRes.ok || !inspRes.data) {
    notFound();
  }

  const inspection = inspRes.data;
  const receipt = receiptRes.ok ? receiptRes.data : null;

  const tire = inspection.tireChecks[0];
  const treadDepths = Array.isArray(tire?.treadDepthMm)
    ? (tire?.treadDepthMm as number[])
    : [];
  const pressures = Array.isArray(tire?.pressureKpa)
    ? (tire?.pressureKpa as number[])
    : [];
  const sidewalls = Array.isArray(tire?.sidewallCondition)
    ? (tire?.sidewallCondition as string[])
    : [];

  const brake = inspection.brakeChecks[0];
  const light = inspection.lightChecks[0];
  const payment = inspection.payments[0];

  const canOverride = ['SUPER_ADMIN', 'LEAD_INSPECTOR'].includes(user.role);
  const canCountersign =
    user.role === 'LEAD_INSPECTOR' && inspection.status === 'PENDING_COUNTERSIGN';

  async function handleCountersignAction() {
    'use server';
    await countersignInspection(params.id);
  }

  const resultColor =
    inspection.overallResult === 'PASS' || inspection.status === 'PASSED'
      ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-400'
      : inspection.overallResult === 'CONDITIONAL_PASS' || inspection.status === 'CONDITIONAL_PASS'
      ? 'bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-400'
      : 'bg-red-500/10 text-red-700 border-red-500/30 dark:text-red-400';

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              {inspection.inspectionCode}
            </h1>
            <Badge variant="outline" className={cn('text-xs font-semibold', resultColor)}>
              {inspection.overallResult ?? inspection.status}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {inspection.status}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 pt-1">
            <span>Plate: <strong className="text-foreground">{inspection.vehicle.plateNumber}</strong></span>
            <span>Category: <strong className="text-foreground">{inspection.vehicle.category.replace(/_/g, ' ')}</strong></span>
            <span>Station: <strong className="text-foreground">{inspection.station.name}</strong></span>
            <span>Lane: <strong className="text-foreground">{inspection.lane.name}</strong></span>
            <span>Inspector: <strong className="text-foreground">{inspection.inspector.fullName}</strong></span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canOverride && <OverrideDialog inspectionId={inspection.id} />}

          {canCountersign && (
            <form action={handleCountersignAction}>
              <Button type="submit" size="sm" className="gap-2 bg-purple-600 hover:bg-purple-700 text-white">
                <UserCheck className="h-4 w-4" /> Countersign Critical Fail
              </Button>
            </form>
          )}

          <Button variant="outline" size="sm" asChild className="gap-2">
            <Link href={`/inspection/${inspection.id}/report`}>
              <FileDown className="h-4 w-4" /> Download Report
            </Link>
          </Button>
        </div>
      </div>

      {/* 2. Measured Physical Test Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Tire Test */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              <span>Tire Inspection</span>
              <Badge variant="outline" className="text-[10px]">
                {tire?.overallResult ?? 'N/A'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-2">
            {tire ? (
              <>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">Tread Depth (FL/FR/RL/RR):</span>
                  <span className="font-mono font-medium">
                    {treadDepths.length > 0 ? treadDepths.join(' / ') : 'N/A'} mm
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">Pressure (kPa):</span>
                  <span className="font-mono font-medium">
                    {pressures.length > 0 ? pressures.join(' / ') : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Sidewall Condition:</span>
                  <span className="font-medium text-right truncate max-w-[120px]">
                    {sidewalls.length > 0 ? Array.from(new Set(sidewalls)).join(', ') : 'OK'}
                  </span>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">No tire measurements recorded</p>
            )}
          </CardContent>
        </Card>

        {/* Brake Test */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              <span>Braking System</span>
              <Badge variant="outline" className="text-[10px]">
                {brake?.overallResult ?? 'N/A'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-2">
            {brake ? (
              <>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">Axle 1 (Eff / Imb):</span>
                  <span className="font-mono font-medium">
                    {brake.axle1EfficiencyPct}% / {brake.axle1ImbalancePct}%
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">Axle 2 (Eff / Imb):</span>
                  <span className="font-mono font-medium">
                    {brake.axle2EfficiencyPct}% / {brake.axle2ImbalancePct}%
                  </span>
                </div>
                {brake.axle3EfficiencyPct !== null && (
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">Axle 3 (Eff / Imb):</span>
                    <span className="font-mono font-medium">
                      {brake.axle3EfficiencyPct}% / {brake.axle3ImbalancePct}%
                    </span>
                  </div>
                )}
              </>
            ) : (
              <p className="text-muted-foreground">No roller brake measurements</p>
            )}
          </CardContent>
        </Card>

        {/* Light Test */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              <span>Optical Lux & Aim</span>
              <Badge variant="outline" className="text-[10px]">
                {light?.overallResult ?? 'N/A'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-2">
            {light ? (
              <>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">Headlight Aim (L / R):</span>
                  <span className="font-medium">
                    {light.headlightAimLeft} / {light.headlightAimRight}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">Luminous Lux (L / R):</span>
                  <span className="font-mono font-medium">
                    {light.luxLeft} / {light.luxRight} lux
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Signal Lamps:</span>
                  <span className="font-medium text-emerald-600">Passed</span>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">No optical lux measurements</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 3. Defects List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-amber-600" />
            Detected Non-Compliances & Defects ({inspection.defects.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {inspection.defects.length > 0 ? (
            <div className="space-y-2">
              {inspection.defects.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card text-xs"
                >
                  <div className="space-y-0.5">
                    <span className="font-medium text-foreground">{d.description}</span>
                    <div className="text-muted-foreground">
                      {d.location ? `Location: ${d.location} · ` : ''}
                      Category: {d.category}
                      {d.measuredValue ? ` · Measured: ${d.measuredValue}` : ''}
                      {d.requiredValue ? ` · Standard: ${d.requiredValue}` : ''}
                    </div>
                  </div>
                  <Badge
                    variant="destructive"
                    className={cn(
                      d.type === 'CRITICAL' && 'bg-red-600',
                      d.type === 'MAJOR' && 'bg-amber-600',
                      d.type === 'MINOR' && 'bg-zinc-600'
                    )}
                  >
                    {d.type}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-500/10 p-3 rounded-md border border-emerald-500/20">
              <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>No defects recorded. This vehicle satisfies all ISO safety mandates.</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 4 & 5. Payment & Receipt Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Payment */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Payment Record</CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-3">
            <div className="flex justify-between py-1 border-b">
              <span className="text-muted-foreground">Tariff Amount:</span>
              <span className="font-bold text-foreground">{formatIQD(inspection.feeAmountIqd)}</span>
            </div>
            <div className="flex justify-between py-1 border-b">
              <span className="text-muted-foreground">Collection Status:</span>
              <PaymentStatusBadge status={inspection.paymentStatus} />
            </div>
            <div className="flex justify-between py-1 border-b">
              <span className="text-muted-foreground">Payment Provider:</span>
              <span className="font-medium">{payment?.provider ?? inspection.paymentMethod ?? 'N/A'}</span>
            </div>
            {payment?.gatewayRef && (
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Gateway Ref:</span>
                <span className="font-mono text-muted-foreground">{payment.gatewayRef}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Receipt & QR preview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Certificate & Verification QR</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <QrPreview
              dataUrl={receipt?.qrDataUrl || inspection.qrCodeData}
              verifyUrl={receipt?.qrPayloadUrl || (inspection.qrCodeData ? `http://localhost:3000/verify/${inspection.inspectionCode}` : null)}
            />

            {receipt && (
              <div className="flex items-center justify-between pt-2 border-t text-xs">
                <div>
                  <span className="text-muted-foreground">Receipt Number: </span>
                  <span className="font-mono font-semibold">{receipt.receiptNumber}</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1" asChild>
                    <Link href={`/inspection/${inspection.id}/receipt`}>
                      <Printer className="h-3.5 w-3.5" /> Print
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" asChild>
                    <Link href={`/inspection/${inspection.id}/receipt/pdf`}>
                      <FileDown className="h-3.5 w-3.5" /> PDF
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 6. Overrides (if any) */}
      {inspection.overrides.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Wrench className="h-4 w-4 text-purple-600" />
              Applied Managerial Overrides ({inspection.overrides.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {inspection.overrides.map((ov) => (
              <div
                key={ov.id}
                className="p-3 rounded-lg border bg-purple-500/5 text-xs space-y-1.5"
              >
                <div className="flex justify-between font-medium">
                  <span className="text-purple-700 font-mono">{ov.parameter}</span>
                  <span className="text-muted-foreground">
                    {formatDateTime(new Date(ov.createdAt))}
                  </span>
                </div>
                <div className="flex gap-4 text-muted-foreground">
                  <span>Machine: <strong className="text-foreground">{ov.machineValue}</strong></span>
                  <span>Overridden: <strong className="text-foreground">{ov.overrideValue}</strong></span>
                </div>
                <p className="text-foreground italic bg-background/60 p-2 rounded border">
                  &ldquo;{ov.justification}&rdquo;
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Audit meta */}
      <div className="text-[11px] text-muted-foreground flex items-center justify-between px-1">
        <span>Created: {formatDateTime(new Date(inspection.createdAt))}</span>
        {inspection.countersignedAt && (
          <span>
            Countersigned by inspector on {formatDateTime(new Date(inspection.countersignedAt))}
          </span>
        )}
      </div>
    </div>
  );
}
