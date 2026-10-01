// FILE: src/app/(auth)/layout.tsx
// STAGE: 5
// UPDATED: 2026-10-01
import React from 'react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 dark:bg-slate-900 px-4 py-12">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
