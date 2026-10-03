// FILE: src/lib/print/encoder.ts
// STAGE: 3
// UPDATED: 2026-10-01
import ReceiptPrinterEncoder from '@point-of-sale/receipt-printer-encoder';
import { formatDateTime, formatIQD } from '../utils';

export interface BuildReceiptParams {
  receiptNumber: string;
  inspectionCode: string;
  plateNumber: string;
  category: string;
  stationName: string;
  laneName: string;
  result: string;
  defects: { type: string; description: string }[];
  qrUrl: string;
  paidAmountIqd?: number;
  paymentMethod?: string;
  issuedAt: Date;
  widthMm: 58 | 80;
}

export function buildInspectionReceipt(params: BuildReceiptParams): Uint8Array {
  const {
    receiptNumber,
    inspectionCode,
    plateNumber,
    category,
    stationName,
    laneName,
    result,
    defects,
    qrUrl,
    paidAmountIqd,
    paymentMethod,
    issuedAt,
    widthMm,
  } = params;

  const columns = widthMm === 80 ? 48 : 32;
  const encoder = new ReceiptPrinterEncoder({ columns });

  encoder
    .initialize()
    .align('center')
    .bold(true)
    .line('UNION INSPECTION')
    .bold(false)
    .line('یونیەن ئینسپێکشن')
    .line(stationName)
    .rule()
    .align('left')
    .line(`Receipt No: ${receiptNumber}`)
    .line(`Inspection: ${inspectionCode}`)
    .line(`Plate No:   ${plateNumber}`)
    .line(`Category:   ${category}`)
    .line(`Lane:       ${laneName}`)
    .rule()
    .align('center')
    .bold(true)
    .line(`RESULT: ${result.toUpperCase()}`)
    .bold(false)
    .rule();

  if (defects.length > 0) {
    encoder.align('left').bold(true).line('DEFECTS DETECTED:').bold(false);
    for (const d of defects) {
      encoder.line(`- [${d.type}] ${d.description}`);
    }
    encoder.rule();
  }

  encoder
    .align('center')
    .qrcode(qrUrl, 1, 4, 'h')
    .line('Scan to verify')
    .rule();

  if (paidAmountIqd !== undefined) {
    encoder
      .align('left')
      .line(`Fee Paid:   ${formatIQD(paidAmountIqd)}`)
      .line(`Method:     ${paymentMethod || 'CASH'}`)
      .rule();
  }

  encoder
    .align('center')
    .line(`Issued: ${formatDateTime(issuedAt)}`)
    .newline(3)
    .cut();

  return encoder.encode();
}
