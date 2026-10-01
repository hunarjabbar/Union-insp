// FILE: src/lib/iso/kpi-registry.ts
// STAGE: 4
// UPDATED: 2026-10-01
import { prisma } from '../prisma';
import { Prisma, Role } from '@prisma/client';

export interface KpiDefinition {
  id: string;
  name: string;
  formula: string;
  target: number;
  isoStandard: 'ISO_17020' | 'ISO_27001' | 'ISO_9001' | 'ISO_39001';
  frequency: 'realtime' | 'hourly' | 'daily' | 'monthly';
  ownerRole: Role;
  compute: (filter: {
    stationId?: string;
    days: number;
  }) => Promise<number | { value: number; series: { day: string; value: number }[] }>;
}

export const KPI_REGISTRY: KpiDefinition[] = [
  {
    id: 'pass_rate',
    name: 'Inspection Pass Rate',
    formula: 'PASSED / (PASSED + CONDITIONAL_PASS + FAILED) * 100',
    target: 80,
    isoStandard: 'ISO_39001',
    frequency: 'daily',
    ownerRole: Role.SUPER_ADMIN,
    compute: async ({ stationId, days }) => {
      const dateLimit = new Date();
      dateLimit.setDate(dateLimit.getDate() - days);

      const rows = await prisma.$queryRaw<
        { day: string; passed: number; total: number }[]
      >`
        SELECT 
          TO_CHAR(created_at, 'YYYY-MM-DD') as day,
          COUNT(CASE WHEN status = 'PASSED' THEN 1 END)::float as passed,
          COUNT(CASE WHEN status IN ('PASSED', 'CONDITIONAL_PASS', 'FAILED') THEN 1 END)::float as total
        FROM inspections
        WHERE created_at >= ${dateLimit}
        ${stationId ? Prisma.sql`AND station_id = ${stationId}` : Prisma.empty}
        GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
        ORDER BY day ASC
      `;

      let totalPassed = 0;
      let totalCompleted = 0;
      const series = rows.map((r) => {
        const passed = Number(r.passed) || 0;
        const total = Number(r.total) || 0;
        totalPassed += passed;
        totalCompleted += total;
        return {
          day: r.day,
          value: total > 0 ? Math.round((passed / total) * 100) : 0,
        };
      });

      const overall = totalCompleted > 0 ? Math.round((totalPassed / totalCompleted) * 100) : 0;
      return { value: overall, series };
    },
  },
  {
    id: 'defect_frequency_rate',
    name: 'Defect Frequency Rate',
    formula: 'Defects / Inspections',
    target: 1.5,
    isoStandard: 'ISO_9001',
    frequency: 'daily',
    ownerRole: Role.STATION_MANAGER,
    compute: async ({ stationId, days }) => {
      const dateLimit = new Date();
      dateLimit.setDate(dateLimit.getDate() - days);

      const rows = await prisma.$queryRaw<
        { day: string; defect_count: number; inspection_count: number }[]
      >`
        SELECT 
          TO_CHAR(i.created_at, 'YYYY-MM-DD') as day,
          COUNT(d.id)::float as defect_count,
          COUNT(DISTINCT i.id)::float as inspection_count
        FROM inspections i
        LEFT JOIN defects d ON d.inspection_id = i.id
        WHERE i.created_at >= ${dateLimit}
        ${stationId ? Prisma.sql`AND i.station_id = ${stationId}` : Prisma.empty}
        GROUP BY TO_CHAR(i.created_at, 'YYYY-MM-DD')
        ORDER BY day ASC
      `;

      let totalDefects = 0;
      let totalInspections = 0;
      const series = rows.map((r) => {
        const dCount = Number(r.defect_count) || 0;
        const iCount = Number(r.inspection_count) || 0;
        totalDefects += dCount;
        totalInspections += iCount;
        return {
          day: r.day,
          value: iCount > 0 ? parseFloat((dCount / iCount).toFixed(2)) : 0,
        };
      });

      const overall = totalInspections > 0 ? parseFloat((totalDefects / totalInspections).toFixed(2)) : 0;
      return { value: overall, series };
    },
  },
  {
    id: 'mean_time_to_detection',
    name: 'Mean Time To Detection',
    formula: 'AVG(completedAt - startedAt) in minutes',
    target: 15,
    isoStandard: 'ISO_17020',
    frequency: 'daily',
    ownerRole: Role.LEAD_INSPECTOR,
    compute: async ({ stationId, days }) => {
      const dateLimit = new Date();
      dateLimit.setDate(dateLimit.getDate() - days);

      const rows = await prisma.$queryRaw<{ avg_duration: number }[]>`
        SELECT 
          AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 60)::float as avg_duration
        FROM inspections
        WHERE created_at >= ${dateLimit}
          AND status IN ('PASSED', 'CONDITIONAL_PASS', 'FAILED')
          ${stationId ? Prisma.sql`AND station_id = ${stationId}` : Prisma.empty}
      `;

      const val = rows[0]?.avg_duration;
      return val !== null && val !== undefined ? parseFloat(Number(val).toFixed(1)) : 0;
    },
  },
  {
    id: 'critical_failure_rate',
    name: 'Critical Failure Rate',
    formula: 'FAILED / Total * 100',
    target: 10,
    isoStandard: 'ISO_39001',
    frequency: 'daily',
    ownerRole: Role.SUPER_ADMIN,
    compute: async ({ stationId, days }) => {
      const dateLimit = new Date();
      dateLimit.setDate(dateLimit.getDate() - days);

      const rows = await prisma.$queryRaw<
        { day: string; failed: number; total: number }[]
      >`
        SELECT 
          TO_CHAR(created_at, 'YYYY-MM-DD') as day,
          COUNT(CASE WHEN status = 'FAILED' THEN 1 END)::float as failed,
          COUNT(id)::float as total
        FROM inspections
        WHERE created_at >= ${dateLimit}
        ${stationId ? Prisma.sql`AND station_id = ${stationId}` : Prisma.empty}
        GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
        ORDER BY day ASC
      `;

      let totalFailed = 0;
      let totalCount = 0;
      const series = rows.map((r) => {
        const failed = Number(r.failed) || 0;
        const total = Number(r.total) || 0;
        totalFailed += failed;
        totalCount += total;
        return {
          day: r.day,
          value: total > 0 ? Math.round((failed / total) * 100) : 0,
        };
      });

      const overall = totalCount > 0 ? Math.round((totalFailed / totalCount) * 100) : 0;
      return { value: overall, series };
    },
  },
  {
    id: 'average_inspection_duration',
    name: 'Average Inspection Duration',
    formula: 'AVG(completedAt - startedAt) in minutes',
    target: 12,
    isoStandard: 'ISO_9001',
    frequency: 'daily',
    ownerRole: Role.STATION_MANAGER,
    compute: async ({ stationId, days }) => {
      const dateLimit = new Date();
      dateLimit.setDate(dateLimit.getDate() - days);

      const rows = await prisma.$queryRaw<{ avg_duration: number }[]>`
        SELECT 
          AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 60)::float as avg_duration
        FROM inspections
        WHERE created_at >= ${dateLimit}
          AND status IN ('PASSED', 'CONDITIONAL_PASS', 'FAILED')
          ${stationId ? Prisma.sql`AND station_id = ${stationId}` : Prisma.empty}
      `;

      const val = rows[0]?.avg_duration;
      return val !== null && val !== undefined ? parseFloat(Number(val).toFixed(1)) : 0;
    },
  },
  {
    id: 'override_rate',
    name: 'Override Rate',
    formula: 'Overrides / Inspections * 100',
    target: 2,
    isoStandard: 'ISO_17020',
    frequency: 'monthly',
    ownerRole: Role.COMPLIANCE_AUDITOR,
    compute: async ({ stationId, days }) => {
      const dateLimit = new Date();
      dateLimit.setDate(dateLimit.getDate() - days);

      const rows = await prisma.$queryRaw<
        { overrides: number; inspections: number }[]
      >`
        SELECT 
          COUNT(o.id)::float as overrides,
          COUNT(DISTINCT i.id)::float as inspections
        FROM inspections i
        LEFT JOIN overrides o ON o.inspection_id = i.id
        WHERE i.created_at >= ${dateLimit}
        ${stationId ? Prisma.sql`AND i.station_id = ${stationId}` : Prisma.empty}
      `;

      const overrides = Number(rows[0]?.overrides) || 0;
      const inspections = Number(rows[0]?.inspections) || 0;
      return inspections > 0 ? parseFloat(((overrides / inspections) * 100).toFixed(1)) : 0;
    },
  },
  {
    id: 'countersign_rate',
    name: 'Counter-signature Rate',
    formula: 'Countersigned / PENDING_COUNTERSIGN * 100',
    target: 100,
    isoStandard: 'ISO_17020',
    frequency: 'monthly',
    ownerRole: Role.COMPLIANCE_AUDITOR,
    compute: async ({ stationId, days }) => {
      const dateLimit = new Date();
      dateLimit.setDate(dateLimit.getDate() - days);

      const rows = await prisma.$queryRaw<
        { signed: number; total: number }[]
      >`
        SELECT 
          COUNT(CASE WHEN status != 'PENDING_COUNTERSIGN' THEN 1 END)::float as signed,
          COUNT(id)::float as total
        FROM inspections
        WHERE created_at >= ${dateLimit}
          AND status IN ('PASSED', 'FAILED', 'PENDING_COUNTERSIGN')
          ${stationId ? Prisma.sql`AND station_id = ${stationId}` : Prisma.empty}
      `;

      const signed = Number(rows[0]?.signed) || 0;
      const total = Number(rows[0]?.total) || 0;
      return total > 0 ? Math.round((signed / total) * 100) : 0;
    },
  },
];
