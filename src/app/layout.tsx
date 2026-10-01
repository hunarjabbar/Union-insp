// FILE: src/app/layout.tsx
// STAGE: 1
// UPDATED: 2026-10-01
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Union Inspection',
  description: 'ISO-compliant vehicle inspection platform for heavy trucks and tour buses in Sulaymaniyah, Kurdistan.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
