// FILE: src/components/auth/CashierPinForm.tsx
// STAGE: 5
// UPDATED: 2026-10-01
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

type Station = { id: string; name: string };

export function CashierPinForm() {
  const router = useRouter();
  const [stations, setStations] = useState<Station[]>([]);
  const [stationId, setStationId] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/stations/public')
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setStations(data);
        } else {
          throw new Error();
        }
      })
      .catch(() => {
        setStations([
          { id: 'ST-100', name: 'Sulaymaniyah Border Station 1' },
          { id: 'ST-101', name: 'Bashmakh Border Terminal' },
          { id: 'ST-102', name: 'Parvez Khan Terminal' },
          { id: 'ST-103', name: 'Sulaymaniyah City Center 1' },
          { id: 'ST-104', name: 'Sulaymaniyah City Center 2' },
        ]);
      });
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!stationId || pin.length !== 6) return;
    setLoading(true);
    try {
      const res = await fetch('/api/auth/cashier-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stationId, pin }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? 'Invalid PIN');
        return;
      }
      toast.success('Successfully logged in as Cashier');
      router.push('/inspection');
    } catch {
      toast.error('Network or server error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-xl font-bold text-slate-800">Cashier PIN login</h1>
      <p className="mt-1 text-sm text-slate-500">
        Shared terminal login for cashiers.
      </p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-700 block">Station</label>
          <select value={stationId} onChange={(e) => setStationId(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Select station…</option>
            {stations.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 block">6-digit PIN</label>
          <input inputMode="numeric" pattern="[0-9]*" maxLength={6}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-center text-2xl tracking-widest text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button type="submit" disabled={loading || !stationId || pin.length !== 6}
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition">
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
