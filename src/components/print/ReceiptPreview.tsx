// FILE: src/components/print/ReceiptPreview.tsx
// STAGE: 13
// UPDATED: 2026-10-02

// On-screen 80mm-style preview that mirrors the ESC/POS layout.
// No 'use client' needed — pure presentation.

import { formatIQD, formatDateTime } from '@/lib/utils';

interface ReceiptPayload {
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
  issuedAt: Date | string;
}

export function ReceiptPreview({ payload }: { payload: ReceiptPayload }) {
  return (
    <div className="mx-auto w-[300px] rounded-md border bg-white p-4 font-mono text-xs leading-tight text-black shadow-sm">
      <div className="text-center">
        <div className="font-bold">UNION INSPECTION</div>
        <div>یونیەن ئینسپێکشن</div>
        <div>{payload.stationName}</div>
      </div>
      <hr className="my-2 border-dashed border-black" />
      <div>Receipt: {payload.receiptNumber}</div>
      <div>Code:    {payload.inspectionCode}</div>
      <div>Plate:   {payload.plateNumber}</div>
      <div>Type:    {payload.category}</div>
      <div>Lane:    {payload.laneName}</div>
      <hr className="my-2 border-dashed border-black" />
      <div className="text-center font-bold">RESULT: {payload.result}</div>
      <hr className="my-2 border-dashed border-black" />
      {payload.defects.length > 0 ? (
        payload.defects.map((d, i) => (
          <div key={i}>[{d.type}] {d.description}</div>
        ))
      ) : (
        <div>No defects recorded.</div>
      )}
      <hr className="my-2 border-dashed border-black" />
      <div className="text-center">
        <div className="mx-auto my-2 flex h-24 w-24 items-center justify-center border border-black">
          QR
        </div>
        <div className="break-all text-[10px]">{payload.qrUrl}</div>
      </div>
      <hr className="my-2 border-dashed border-black" />
      {payload.paidAmountIqd ? (
        <>
          <div>Paid: {formatIQD(payload.paidAmountIqd)}</div>
          <div>Method: {payload.paymentMethod ?? 'CASH'}</div>
        </>
      ) : null}
      <div>Issued: {formatDateTime(payload.issuedAt)}</div>
      <div className="mt-2 text-center">
        Keep this receipt in the vehicle.
      </div>
    </div>
  );
}
