// FILE: src/components/auth/MfaForm.tsx
// STAGE: 5
// UPDATED: 2026-10-01
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function MfaForm() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [mfaToken, setMfaToken] = useState<string | null>(null);

  useEffect(() => {
    const t = sessionStorage.getItem('mfaToken');
    if (!t) router.push('/login');
    else setMfaToken(t);
  }, [router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!mfaToken || code.length !== 6) return;
    setLoading(true);
    try {
      const res = await fetch('/api/auth/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mfaToken, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? 'Invalid code');
        return;
      }
      toast.success('Two-factor authentication successful');
      sessionStorage.removeItem('mfaToken');
      router.push('/inspection');
    } catch {
      toast.error('Network or server error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-xl font-bold text-slate-800">Two-factor authentication</h1>
      <p className="mt-1 text-sm text-slate-500">
        Enter the 6-digit code from your authenticator app.
      </p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <input
          inputMode="numeric" pattern="[0-9]*" maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-center text-2xl tracking-widest text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
        />
        <button type="submit" disabled={loading || code.length !== 6}
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition">
          {loading ? 'Verifying…' : 'Verify'}
        </button>
      </form>
    </div>
  );
}
