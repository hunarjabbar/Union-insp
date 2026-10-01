// FILE: src/lib/utils.ts
// STAGE: 3
// UPDATED: 2026-10-01
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatIQD(n: number): string {
  return new Intl.NumberFormat('en-IQ', {
    style: 'currency',
    currency: 'IQD',
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatDateTime(d: Date | string): string {
  return format(new Date(d), 'yyyy-MM-dd HH:mm');
}

export function formatDate(d: Date | string): string {
  return format(new Date(d), 'yyyy-MM-dd');
}

export function generateInspectionCode(): string {
  const year = new Date().getFullYear();
  const digits = Math.floor(100000 + Math.random() * 900000).toString();
  return `UI-${year}-${digits}`;
}

export function generateNcrNumber(): string {
  const year = new Date().getFullYear();
  const digits = Math.floor(1000 + Math.random() * 9000).toString();
  return `NCR-${year}-${digits}`;
}

export function generateReceiptNumber(): string {
  const year = new Date().getFullYear();
  const digits = Math.floor(100000 + Math.random() * 900000).toString();
  return `RCP-${year}-${digits}`;
}
