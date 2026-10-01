// FILE: src/app/(auth)/unauthorized/page.tsx
// STAGE: 5
// UPDATED: 2026-10-01
import React from 'react';
import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
      <h1 className="text-2xl font-bold text-slate-800">Access denied</h1>
      <p className="mt-2 text-sm text-slate-500">
        Your role does not permit this page.
      </p>
      <Link href="/inspection"
        className="mt-4 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 transition">
        Back to dashboard
      </Link>
    </div>
  );
}
