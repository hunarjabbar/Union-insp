// FILE: src/app/(public)/layout.tsx
// STAGE: 11
// UPDATED: 2026-10-02
import * as React from 'react';
import Link from 'next/link';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex flex-col">
            <span className="text-sm font-bold tracking-wide">
              UNION VEHICLE INSPECTION
            </span>
            <span className="text-xs text-muted-foreground">
              یونیەن ئینسپێکشن · Sulaymaniyah
            </span>
          </Link>
          <span className="text-xs text-muted-foreground">
            ISO/IEC 17020:2012
          </span>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-3xl flex-1 items-start justify-center px-6 py-10">
        {children}
      </main>
      <footer className="border-t bg-card py-4">
        <div className="mx-auto max-w-4xl px-6 text-center text-xs text-muted-foreground">
          Union of Workers Syndicates in Kurdistan — Sulaymaniyah Branch
        </div>
      </footer>
    </div>
  );
}
