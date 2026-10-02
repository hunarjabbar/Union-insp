// FILE: src/components/payments/PaymentStep.tsx
// STAGE: 8
// UPDATED: 2026-10-02
'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Banknote, Smartphone, Loader2, QrCode, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatIQD, cn } from '@/lib/utils';
import {
  initiatePayment,
  confirmCashPayment,
  getPaymentStatus,
} from '@/actions/payments';

export interface PaymentStepProps {
  inspectionId: string;
  amountIqd: number;
  onComplete: (paymentId: string) => void;
}

type Provider = 'CASH' | 'FASTPAY' | 'ZAINCASH' | 'FIB';

const PROVIDERS: { id: Provider; name: string; icon: React.ElementType; desc: string }[] = [
  { id: 'CASH', name: 'Cash', icon: Banknote, desc: 'Collect directly at counter' },
  { id: 'FASTPAY', name: 'FastPay', icon: Smartphone, desc: 'Scan to pay via FastPay QR' },
  { id: 'ZAINCASH', name: 'ZainCash', icon: Smartphone, desc: 'ZainCash mobile wallet' },
  { id: 'FIB', name: 'First Iraqi Bank', icon: QrCode, desc: 'FIB instant digital payment' },
];

export function PaymentStep({
  inspectionId,
  amountIqd,
  onComplete,
}: PaymentStepProps) {
  const [provider, setProvider] = React.useState<Provider>('CASH');
  const [paymentId, setPaymentId] = React.useState<string | null>(null);
  const [qrData, setQrData] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<string>('PENDING');
  const [pending, setPending] = React.useState(false);

  // Poll digital payments
  React.useEffect(() => {
    if (!paymentId || provider === 'CASH' || status === 'COMPLETED' || status === 'FAILED') {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const res = await getPaymentStatus(paymentId);
        if (res.ok && res.data) {
          if (res.data.status === 'COMPLETED') {
            setStatus('COMPLETED');
            toast.success('Digital payment received successfully!');
            clearInterval(interval);
            onComplete(paymentId);
          } else if (res.data.status === 'FAILED') {
            setStatus('FAILED');
            toast.error(res.data.failureReason || 'Payment failed at gateway');
            clearInterval(interval);
          }
        }
      } catch {
        // Continue polling
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [paymentId, provider, status, onComplete]);

  async function handleProviderSelect(selected: Provider) {
    setProvider(selected);
    setPaymentId(null);
    setQrData(null);
    setStatus('PENDING');

    if (selected !== 'CASH') {
      setPending(true);
      try {
        const res = await initiatePayment({
          inspectionId,
          provider: selected,
        });

        if (res.ok) {
          setPaymentId(res.data.paymentId);
          setQrData(res.data.qrData ?? null);
          toast.info(`Payment initiated with ${selected}. Awaiting completion...`);
        } else {
          toast.error(res.error || 'Failed to initiate digital payment');
        }
      } catch {
        toast.error('Unexpected error initiating payment');
      } finally {
        setPending(false);
      }
    }
  }

  async function handleCashConfirm() {
    setPending(true);
    try {
      const res = await confirmCashPayment({
        inspectionId,
        amountIqd,
      });

      if (res.ok) {
        setStatus('COMPLETED');
        toast.success(`Cash payment of ${formatIQD(amountIqd)} recorded!`);
        onComplete(res.data.id);
      } else {
        toast.error(res.error || 'Failed to record cash payment');
      }
    } catch {
      toast.error('Unexpected error processing cash');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold">Select Payment Method</h3>
        <p className="text-sm text-muted-foreground">
          Fee required for inspection certificate: {formatIQD(amountIqd)}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {PROVIDERS.map((p) => {
          const Icon = p.icon;
          const isSelected = provider === p.id;
          return (
            <Card
              key={p.id}
              onClick={() => !pending && handleProviderSelect(p.id)}
              className={cn(
                'cursor-pointer transition-all border-2',
                isSelected
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'hover:border-primary/50'
              )}
            >
              <CardContent className="p-4 flex flex-col items-center text-center space-y-2">
                <Icon
                  className={cn(
                    'h-8 w-8',
                    isSelected ? 'text-primary' : 'text-muted-foreground'
                  )}
                />
                <div className="font-semibold text-sm">{p.name}</div>
                <div className="text-xs text-muted-foreground">{p.desc}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {provider === 'CASH' ? (
        <div className="p-6 rounded-lg border bg-card text-center space-y-4">
          <div className="text-lg font-bold">
            Amount Due: {formatIQD(amountIqd)}
          </div>
          <Button
            size="lg"
            onClick={handleCashConfirm}
            disabled={pending || status === 'COMPLETED'}
          >
            {pending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Recording cash...
              </span>
            ) : status === 'COMPLETED' ? (
              <span className="flex items-center gap-2 text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
                Cash Collected
              </span>
            ) : (
              `Confirm ${formatIQD(amountIqd)} Received`
            )}
          </Button>
        </div>
      ) : (
        <div className="p-6 rounded-lg border bg-card flex flex-col items-center text-center space-y-4">
          {pending ? (
            <div className="flex flex-col items-center justify-center p-8 space-y-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Connecting to gateway...</p>
            </div>
          ) : qrData ? (
            <div className="space-y-3">
              <p className="text-sm font-medium">Scan to pay with your {provider} app</p>
              <div className="p-4 bg-white rounded-lg shadow-inner inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrData} alt="Payment QR Code" className="h-48 w-48 object-contain" />
              </div>
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                <span>Awaiting transaction confirmation...</span>
              </div>
            </div>
          ) : (
            <div className="p-6 text-sm text-muted-foreground">
              Please wait or select another payment method.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
