// FILE: src/app/page.tsx
// STAGE: 1
// UPDATED: 2026-10-01
import React from 'react';

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
      <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl text-blue-600 mb-4">
        UNION VEHICLE INSPECTION
      </h1>
      <p className="text-xl text-slate-600 max-w-2xl mb-8">
        Sulaymaniyah heavyduty truck and bus compliance center. ISO-17020 certified inspection reporting, payments and secure QR verification.
      </p>
      <div className="flex gap-4">
        <a
          href="/dashboard"
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg shadow-md hover:bg-blue-700 transition"
        >
          Go to Dashboard
        </a>
      </div>
    </main>
  );
}
