// FILE: src/app/(dashboard)/inspection/[id]/page.tsx
// STAGE: 13
// UPDATED: 2026-10-02

import { notFound, redirect } from 'next/navigation';
import { getAuthUser, requirePermission } from '@/lib/rbac';
import { getInspectionById } from '@/actions/inspections';
import { getReceiptByInspection } from '@/actions/receipts';
import { getDefaultPrinter } from '@/actions/printers';
import { formatIQD, formatDateTime } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OverrideDialog } from '@/components/inspection/OverrideDialog';
import { QrPreview } from '@/components/inspection/QrPreview';
import { PaymentStatusBadge } from '@/components/payments/PaymentStatusBadge';
import { PrintReceiptButton } from '@/components/print/PrintReceiptButton';
import { ReprintDialog } from '@/components/print/ReprintDialog';
import { QrPreviewCard } from '@/components/print/QrPreviewCard';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

function resultBadgeVariant(result: string | null) {
  if (!result) return 'outline' as const;
  if (result === 'PASS' || result === 'PASSED') return 'default' as const;
  if (result === 'CONDITIONAL_PASS') return 'secondary' as const;
  if (result === 'FAIL' || result === 'FAILED') return 'destructive' as const;
  return 'outline' as const;
}

export default async function InspectionDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getAuthUser();
  if (!user) redirect('/login');
  try {
    requirePermission(user, 'inspection', 'read');
  } catch {
    redirect('/unauthorized');
  }

  const result = await getInspectionById(params.id);
  if (!result.ok) notFound();
  const insp = result.data;

  const receiptRes = await getReceiptByInspection(insp.id);
  const receipt = receiptRes.ok ? receiptRes.data : null;

  const printerRes = user.stationId
    ? await getDefaultPrinter(user.stationId)
    : { ok: true as const, data: null };
  const printer = printerRes.ok ? printerRes.data : null;

  const canOverride = user.role === 'SUPER_ADMIN' || user.role === 'LEAD_INSPECTOR';
  const canCountersign =
    insp.status === 'PENDING_COUNTERSIGN' && user.role === 'LEAD_INSPECTOR';

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-mono text-xl">{insp.inspectionCode}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {insp.vehicle.plateNumber} · {insp.vehicle.category} · {insp.station.name} /{' '}
              {insp.lane.name}
            </p>
            <p className="text-xs text-muted-foreground">
              Inspector: {insp.inspector.fullName} · {formatDateTime(insp.createdAt)}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant={resultBadgeVariant(insp.overallResult)}>
              {insp.overallResult ?? 'PENDING'}
            </Badge>
            <Badge variant="outline">{insp.status}</Badge>
            <Link href={`/inspection/${insp.id}/report`} className="text-xs underline">
              Download Report
            </Link>
          </div>
        </CardHeader>
      </Card>

      {/* Test cards */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Tire Inspection</CardTitle>
          </CardHeader>
          <CardContent className="text-xs">
            <p>
              Result:{' '}
              {(insp as any).tireInspection?.overallResult ??
                insp.tireChecks?.[0]?.overallResult ??
                '—'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Brake Inspection</CardTitle>
          </CardHeader>
          <CardContent className="text-xs">
            <p>
              Result:{' '}
              {(insp as any).brakeInspection?.overallResult ??
                insp.brakeChecks?.[0]?.overallResult ??
                '—'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Light Inspection</CardTitle>
          </CardHeader>
          <CardContent className="text-xs">
            <p>
              Result:{' '}
              {(insp as any).lightInspection?.overallResult ??
                insp.lightChecks?.[0]?.overallResult ??
                '—'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Defects */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Defects</CardTitle>
        </CardHeader>
        <CardContent>
          {insp.defects.length === 0 ? (
            <p className="text-xs text-muted-foreground">No defects recorded.</p>
          ) : (
            <ul className="space-y-1 text-xs">
              {insp.defects.map((d) => (
                <li key={d.id} className="flex items-start gap-2">
                  <Badge
                    variant={
                      d.type === 'CRITICAL'
                        ? 'destructive'
                        : d.type === 'MAJOR'
                        ? 'secondary'
                        : 'outline'
                    }
                  >
                    {d.type}
                  </Badge>
                  <span>{d.description}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Payment */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Payment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            Amount: <strong>{formatIQD(insp.feeAmountIqd)}</strong>
          </p>
          {insp.payments[0] ? (
            <>
              <p>Provider: {insp.payments[0].provider}</p>
              <p>
                Status: <PaymentStatusBadge status={insp.payments[0].status} />
              </p>
            </>
          ) : (
            <p className="text-muted-foreground">No payment recorded.</p>
          )}
        </CardContent>
      </Card>

      {/* Receipt panel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Receipt & Passport</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {receipt ? (
            <>
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <p className="font-mono">{receipt.receiptNumber}</p>
                  <p className="text-xs text-muted-foreground">
                    Printed:{' '}
                    {receipt.printedAt ? formatDateTime(receipt.printedAt) : 'not yet'}
                    {' · '}Reprints: {receipt.reprintCount}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {printer && (
                    <PrintReceiptButton
                      receiptId={receipt.id}
                      printerConfigId={printer.id}
                    />
                  )}
                  {printer && (
                    <ReprintDialog
                      receiptId={receipt.id}
                      printerConfigId={printer.id}
                      currentReprintCount={receipt.reprintCount}
                    />
                  )}
                  <Button asChild variant="outline">
                    <a href={`/api/receipts/${receipt.id}/pdf`} target="_blank">
                      Download PDF
                    </a>
                  </Button>
                </div>
              </div>
              <QrPreviewCard
                qrDataUrl={receipt.qrDataUrl}
                qrPayloadUrl={receipt.qrPayloadUrl}
                receiptNumber={receipt.receiptNumber}
              />
            </>
          ) : insp.qrCodeData ? (
            <QrPreview dataUrl={insp.qrCodeData} />
          ) : (
            <p className="text-sm text-muted-foreground">No receipt issued yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Overrides */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm">Overrides</CardTitle>
          {canOverride && <OverrideDialog inspectionId={insp.id} />}
        </CardHeader>
        <CardContent>
          {insp.overrides.length === 0 ? (
            <p className="text-xs text-muted-foreground">None.</p>
          ) : (
            <ul className="space-y-2 text-xs">
              {insp.overrides.map((o) => (
                <li key={o.id}>
                  <p className="font-mono">{o.parameter}</p>
                  <p>
                    From {o.machineValue} → {o.overrideValue}
                  </p>
                  <p className="text-muted-foreground">{o.justification}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Counter-sign */}
      {canCountersign && (
        <form
          action={async () => {
            'use server';
            const { countersignInspection } = await import('@/actions/inspections');
            await countersignInspection(insp.id);
          }}
        >
          <Button type="submit" variant="destructive">
            Counter-sign Inspection
          </Button>
        </form>
      )}
    </div>
  );
}
