// FILE: src/app/api/payments/status/[paymentId]/route.ts
// STAGE: 12
// UPDATED: 2026-10-02

import { NextRequest, NextResponse } from 'next/server';
import { getPaymentStatus } from '@/actions/payments';

export async function GET(
  req: NextRequest,
  { params }: { params: { paymentId: string } }
) {
  const result = await getPaymentStatus(params.paymentId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json(result.data);
}
