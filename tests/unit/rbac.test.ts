// FILE: tests/unit/rbac.test.ts
// STAGE: 14
// UPDATED: 2026-10-03

import { describe, it, expect } from 'vitest';
import {
  requireRole,
  requireStationAccess,
  PERMISSION_MATRIX,
  type AuthUser,
} from '@/lib/rbac';
import { Role } from '@prisma/client';

describe('RBAC Authorization Rules', () => {
  const superAdminUser: AuthUser = {
    userId: 'usr_admin',
    role: 'SUPER_ADMIN',
    email: 'admin@union.iq',
    stationId: 'stn_erbil_01',
  };

  const auditorUser: AuthUser = {
    userId: 'usr_auditor',
    role: 'COMPLIANCE_AUDITOR',
    email: 'auditor@union.iq',
    stationId: 'stn_erbil_01',
  };

  const technicianUser: AuthUser = {
    userId: 'usr_tech',
    role: 'INSPECTION_TECHNICIAN',
    email: 'tech@union.iq',
    stationId: 'stn_erbil_01',
  };

  const cashierUser: AuthUser = {
    userId: 'usr_cashier',
    role: 'CASHIER',
    email: 'cashier@union.iq',
    stationId: 'stn_baghdad_01',
  };

  describe('requireRole', () => {
    it('allows access when user has an permitted role', () => {
      expect(() => requireRole(superAdminUser, ['SUPER_ADMIN', 'STATION_MANAGER'])).not.toThrow();
      expect(() => requireRole(technicianUser, ['INSPECTION_TECHNICIAN'])).not.toThrow();
    });

    it('throws FORBIDDEN when user has an unpermitted role', () => {
      expect(() => requireRole(cashierUser, ['SUPER_ADMIN', 'LEAD_INSPECTOR'])).toThrow('FORBIDDEN');
      expect(() => requireRole(technicianUser, ['COMPLIANCE_AUDITOR'])).toThrow('FORBIDDEN');
    });

    it('throws FORBIDDEN when user is null', () => {
      expect(() => requireRole(null, ['SUPER_ADMIN'])).toThrow('FORBIDDEN');
    });
  });

  describe('requireStationAccess', () => {
    it('allows SUPER_ADMIN and COMPLIANCE_AUDITOR unrestricted station access', () => {
      expect(() => requireStationAccess(superAdminUser, 'stn_basra_01')).not.toThrow();
      expect(() => requireStationAccess(auditorUser, 'stn_basra_01')).not.toThrow();
    });

    it('allows station-bound users access to their assigned station', () => {
      expect(() => requireStationAccess(technicianUser, 'stn_erbil_01')).not.toThrow();
      expect(() => requireStationAccess(cashierUser, 'stn_baghdad_01')).not.toThrow();
    });

    it('throws FORBIDDEN when station-bound users access a different station', () => {
      expect(() => requireStationAccess(technicianUser, 'stn_baghdad_01')).toThrow('FORBIDDEN');
      expect(() => requireStationAccess(cashierUser, 'stn_erbil_01')).toThrow('FORBIDDEN');
    });

    it('throws FORBIDDEN when user is null', () => {
      expect(() => requireStationAccess(null, 'stn_erbil_01')).toThrow('FORBIDDEN');
    });
  });

  describe('PERMISSION_MATRIX shape', () => {
    it('contains all required system domain resources', () => {
      const resources = [
        'user',
        'station',
        'lane',
        'vehicle',
        'inspection',
        'override',
        'equipment',
        'calibration',
        'ncr',
        'auditLog',
        'financial',
        'payment',
        'receipt',
        'printer',
      ];

      for (const res of resources) {
        expect(PERMISSION_MATRIX).toHaveProperty(res);
        expect(typeof PERMISSION_MATRIX[res]).toBe('object');
      }
    });

    it('defines role arrays for all CRUD and operational actions', () => {
      expect(Array.isArray(PERMISSION_MATRIX.inspection.create)).toBe(true);
      expect(PERMISSION_MATRIX.inspection.create).toContain('SUPER_ADMIN' as Role);
      expect(PERMISSION_MATRIX.inspection.create).toContain('INSPECTION_TECHNICIAN' as Role);

      expect(Array.isArray(PERMISSION_MATRIX.payment.create)).toBe(true);
      expect(PERMISSION_MATRIX.payment.create).toContain('CASHIER' as Role);

      expect(Array.isArray(PERMISSION_MATRIX.auditLog.read)).toBe(true);
      expect(PERMISSION_MATRIX.auditLog.read).toContain('COMPLIANCE_AUDITOR' as Role);
    });
  });
});
