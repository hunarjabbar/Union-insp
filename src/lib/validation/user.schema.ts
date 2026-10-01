// FILE: src/lib/validation/user.schema.ts
// STAGE: 6
// UPDATED: 2026-10-01
import { z } from 'zod';

export const zUserCreate = z.object({
  email: z.string().email(),
  fullName: z.string().min(2).max(100),
  password: z.string().min(12).regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/),
  role: z.enum(['SUPER_ADMIN','STATION_MANAGER','LEAD_INSPECTOR',
                'COMPLIANCE_AUDITOR','SYNDICATE_REPRESENTATIVE',
                'INSPECTION_TECHNICIAN','CASHIER']),
  employeeId: z.string().min(1).max(50),
  stationId: z.string().optional(),
  mfaEnabled: z.boolean().optional(),
});

export const zUserUpdate = z.object({
  id: z.string(),
  fullName: z.string().min(2).max(100).optional(),
  stationId: z.string().optional(),
  mfaEnabled: z.boolean().optional(),
});

export const zUserRoleChange = z.object({
  id: z.string(),
  role: z.enum(['SUPER_ADMIN','STATION_MANAGER','LEAD_INSPECTOR',
                'COMPLIANCE_AUDITOR','SYNDICATE_REPRESENTATIVE',
                'INSPECTION_TECHNICIAN','CASHIER']),
});
