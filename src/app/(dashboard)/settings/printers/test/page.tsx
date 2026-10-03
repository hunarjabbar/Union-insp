// FILE: src/app/(dashboard)/settings/printers/test/page.tsx
// STAGE: 13
// UPDATED: 2026-10-02

import { redirect } from 'next/navigation';
import { getAuthUser, requirePermission } from '@/lib/rbac';
import { getDefaultPrinter } from '@/actions/printers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ReceiptPreview } from '@/components/print/ReceiptPreview';
import { TestPrintButton } from '@/components/print/TestPrintButton';

export const dynamic = 'force-dynamic';

export default async function PrinterTestPage() {
  const user = await getAuthUser();
  if (!user) redirect('/login');
  try {
    requirePermission(user, 'printer', 'read');
  } catch {
    redirect('/unauthorized');
  }

  const printerRes = user.stationId
    ? await getDefaultPrinter(user.stationId)
    : { ok: true as const, data: null };
  const printer = printerRes.ok ? printerRes.data : null;

  const sample = {
    receiptNumber: 'RCP-TEST-000000',
    inspectionCode: 'UI-TEST-000000',
    plateNumber: 'TEST-0001',
    category: 'HEAVY_FREIGHT',
    stationName: (printer as any)?.station?.name ?? 'Test Station',
    laneName: 'Lane 1',
    result: 'PASS',
    defects: [{ type: 'MINOR', description: 'Sample advisory' }],
    qrUrl: `${process.env.PRINTER_QR_BASE_URL ?? 'http://localhost:3000/verify'}/TEST-0000`,
    paidAmountIqd: 30000,
    paymentMethod: 'CASH',
    issuedAt: new Date(),
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Printer Test</h1>
      {printer ? (
        <>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              Default printer: <strong>{printer.name}</strong> · {printer.paperWidthMm}mm ·{' '}
              {printer.connectionType}
            </span>
            <TestPrintButton printerConfigId={printer.id} />
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <ReceiptPreview payload={sample} />
            <Card>
              <CardHeader>
                <CardTitle>Instructions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>1. Connect the printer via USB.</p>
                <p>
                  2. Click &ldquo;Print Test Receipt&rdquo; — Chrome will ask for permission on the
                  first attempt.
                </p>
                <p>3. Confirm the QR code is scannable.</p>
                <p>Recommended: Epson TM-T20III or TM-T88VI, 80mm paper.</p>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No default printer configured for your station.{' '}
            <a href="/settings/printers" className="underline">
              Configure one now
            </a>
            .
          </CardContent>
        </Card>
      )}
    </div>
  );
}
