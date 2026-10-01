// FILE: src/lib/validation/common.ts
// STAGE: 3
// UPDATED: 2026-10-01
import { z } from 'zod';

export const zId = z.string().cuid();
export const zPlate = z.string().min(1).max(20);
export const zVin = z.string().length(17).optional().or(z.literal(''));
export const zPassword = z.string().min(12).regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/);
export const zIsoDateString = z.string().refine((s) => !isNaN(Date.parse(s)));
