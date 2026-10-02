// FILE: src/lib/rbac.ts
// STAGE: 3
// UPDATED: 2026-10-01
import { jwtVerify } from 'jose';
import { Role } from '@prisma/client';

export interface AuthUser {
  userId: string;
  role: Role;
  email: string;
  stationId?: string;
}

export const PERMISSION_MATRIX: Record<string, Record<string, Role[]>> = {
  user: {
    create: ['SUPER_ADMIN'],
    read: ['SUPER_ADMIN', 'COMPLIANCE_AUDITOR', 'STATION_MANAGER'],
    update: ['SUPER_ADMIN'],
    delete: ['SUPER_ADMIN'],
  },
  station: {
    create: ['SUPER_ADMIN'],
    read: ['SUPER_ADMIN', 'COMPLIANCE_AUDITOR', 'STATION_MANAGER', 'SYNDICATE_REPRESENTATIVE'],
    update: ['SUPER_ADMIN'],
    delete: ['SUPER_ADMIN'],
  },
  lane: {
    create: ['SUPER_ADMIN', 'STATION_MANAGER'],
    read: ['SUPER_ADMIN', 'STATION_MANAGER', 'COMPLIANCE_AUDITOR', 'LEAD_INSPECTOR'],
    update: ['SUPER_ADMIN', 'STATION_MANAGER'],
    delete: ['SUPER_ADMIN'],
  },
  vehicle: {
    create: ['SUPER_ADMIN', 'STATION_MANAGER', 'LEAD_INSPECTOR'],
    read: ['SUPER_ADMIN', 'STATION_MANAGER', 'LEAD_INSPECTOR', 'COMPLIANCE_AUDITOR', 'INSPECTION_TECHNICIAN'],
    update: ['SUPER_ADMIN', 'STATION_MANAGER', 'LEAD_INSPECTOR'],
    delete: ['SUPER_ADMIN'],
  },
  inspection: {
    create: ['SUPER_ADMIN', 'STATION_MANAGER', 'LEAD_INSPECTOR', 'INSPECTION_TECHNICIAN'],
    read: ['SUPER_ADMIN', 'STATION_MANAGER', 'LEAD_INSPECTOR', 'COMPLIANCE_AUDITOR', 'SYNDICATE_REPRESENTATIVE', 'INSPECTION_TECHNICIAN', 'CASHIER'],
    update: ['SUPER_ADMIN', 'LEAD_INSPECTOR'],
    delete: ['SUPER_ADMIN'],
  },
  override: {
    create: ['SUPER_ADMIN', 'LEAD_INSPECTOR'],
    read: ['SUPER_ADMIN', 'LEAD_INSPECTOR', 'COMPLIANCE_AUDITOR'],
  },
  equipment: {
    create: ['SUPER_ADMIN', 'STATION_MANAGER'],
    read: ['SUPER_ADMIN', 'STATION_MANAGER', 'LEAD_INSPECTOR', 'COMPLIANCE_AUDITOR'],
    update: ['SUPER_ADMIN', 'STATION_MANAGER'],
    delete: ['SUPER_ADMIN'],
  },
  calibration: {
    create: ['SUPER_ADMIN', 'STATION_MANAGER', 'LEAD_INSPECTOR'],
    read: ['SUPER_ADMIN', 'STATION_MANAGER', 'LEAD_INSPECTOR', 'COMPLIANCE_AUDITOR'],
  },
  ncr: {
    create: ['SUPER_ADMIN', 'STATION_MANAGER', 'LEAD_INSPECTOR', 'COMPLIANCE_AUDITOR'],
    read: ['SUPER_ADMIN', 'STATION_MANAGER', 'LEAD_INSPECTOR', 'COMPLIANCE_AUDITOR'],
    update: ['SUPER_ADMIN', 'STATION_MANAGER'],
    close: ['SUPER_ADMIN', 'COMPLIANCE_AUDITOR'],
  },
  auditLog: {
    read: ['SUPER_ADMIN', 'COMPLIANCE_AUDITOR'],
  },
  financial: {
    read: ['SUPER_ADMIN', 'STATION_MANAGER', 'COMPLIANCE_AUDITOR', 'SYNDICATE_REPRESENTATIVE', 'CASHIER'],
    reconcile: ['SUPER_ADMIN', 'STATION_MANAGER', 'CASHIER'],
    payout: ['SUPER_ADMIN'],
  },
  payment: {
    create: ['SUPER_ADMIN', 'STATION_MANAGER', 'LEAD_INSPECTOR', 'CASHIER'],
    read: ['SUPER_ADMIN', 'STATION_MANAGER', 'COMPLIANCE_AUDITOR', 'SYNDICATE_REPRESENTATIVE', 'CASHIER'],
    refund: ['SUPER_ADMIN'],
  },
  receipt: {
    create: ['SUPER_ADMIN', 'STATION_MANAGER', 'LEAD_INSPECTOR', 'CASHIER'],
    read: ['SUPER_ADMIN', 'STATION_MANAGER', 'LEAD_INSPECTOR', 'COMPLIANCE_AUDITOR', 'CASHIER', 'INSPECTION_TECHNICIAN'],
    reprint: ['SUPER_ADMIN', 'STATION_MANAGER', 'LEAD_INSPECTOR', 'CASHIER'],
  },
  printer: {
    create: ['SUPER_ADMIN', 'STATION_MANAGER'],
    read: ['SUPER_ADMIN', 'STATION_MANAGER', 'LEAD_INSPECTOR', 'CASHIER'],
    update: ['SUPER_ADMIN', 'STATION_MANAGER'],
    delete: ['SUPER_ADMIN'],
    print: ['SUPER_ADMIN', 'STATION_MANAGER', 'LEAD_INSPECTOR', 'CASHIER', 'INSPECTION_TECHNICIAN'],
  },
  pricing: {
    update: ['SUPER_ADMIN'],
  },
  system: {
    configure: ['SUPER_ADMIN'],
  },
};

const JWT_SECRET = process.env.JWT_SECRET || '8b8d4cf56a73c1d94f2953288f6be4e37f694e4da20188efac37bdc51b9e2810';

export async function getAuthUser(): Promise<AuthUser | null> {
  try {
    const { cookies } = await import('next/headers');
    const cookieStore = cookies();
    const token = cookieStore.get('union_inspection_token')?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
    if (!payload || !payload.sub || !payload.role || !payload.email) return null;
    return {
      userId: payload.sub,
      role: payload.role as Role,
      email: payload.email as string,
      stationId: (payload.stationId as string) || undefined,
    };
  } catch {
    return null;
  }
}

export function requireRole(user: AuthUser | null, roles: Role[]): void {
  if (!user || !roles.includes(user.role)) throw new Error('FORBIDDEN');
}

export function requirePermission(user: AuthUser | null, resource: string, action: string): void {
  if (!user) throw new Error('FORBIDDEN');
  const allowedRoles = PERMISSION_MATRIX[resource]?.[action];
  if (!allowedRoles || !allowedRoles.includes(user.role)) throw new Error('FORBIDDEN');
}

export function requireStationAccess(user: AuthUser | null, stationId: string): void {
  if (!user) throw new Error('FORBIDDEN');
  if (user.role === 'SUPER_ADMIN' || user.role === 'COMPLIANCE_AUDITOR') return;
  if (user.stationId !== stationId) throw new Error('FORBIDDEN');
}
