// FILE: src/lib/iso/metrics.ts
// STAGE: 4
// UPDATED: 2026-10-01
import { prisma } from '../prisma';
import { Prisma, DefectCategory } from '@prisma/client';

export async function getPassRate(
  stationId?: string,
  days = 30
): Promise<number> {
  const dateLimit = new Date();
  dateLimit.setDate(dateLimit.getDate() - days);

  const result = await prisma.$queryRaw<
    { passed: number; total: number }[]
  >`
    SELECT 
      COUNT(CASE WHEN status = 'PASSED' THEN 1 END)::float as passed,
      COUNT(CASE WHEN status IN ('PASSED', 'CONDITIONAL_PASS', 'FAILED') THEN 1 END)::float as total
    FROM inspections
    WHERE created_at >= ${dateLimit}
    ${stationId ? Prisma.sql`AND station_id = ${stationId}` : Prisma.empty}
  `;

  if (!result || result.length === 0) return 0;
  const passed = Number(result[0].passed) || 0;
  const total = Number(result[0].total) || 0;
  return total > 0 ? Math.round((passed / total) * 100) : 0;
}

export async function getThroughputSeries(
  stationId?: string,
  days = 7
): Promise<{ day: string; count: number }[]> {
  const dateLimit = new Date();
  dateLimit.setDate(dateLimit.getDate() - days);

  const result = await prisma.$queryRaw<
    { day: string; count: number }[]
  >`
    SELECT 
      TO_CHAR(created_at, 'YYYY-MM-DD') as day,
      COUNT(id)::int as count
    FROM inspections
    WHERE created_at >= ${dateLimit}
    ${stationId ? Prisma.sql`AND station_id = ${stationId}` : Prisma.empty}
    GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
    ORDER BY day ASC
  `;

  return result || [];
}

export async function getDefectDistribution(
  stationId?: string,
  days = 30
): Promise<{ category: DefectCategory; count: number }[]> {
  const dateLimit = new Date();
  dateLimit.setDate(dateLimit.getDate() - days);

  const result = await prisma.$queryRaw<
    { category: DefectCategory; count: number }[]
  >`
    SELECT 
      d.category,
      COUNT(d.id)::int as count
    FROM defects d
    JOIN inspections i ON d.inspection_id = i.id
    WHERE i.created_at >= ${dateLimit}
    ${stationId ? Prisma.sql`AND i.station_id = ${stationId}` : Prisma.empty}
    GROUP BY d.category
    ORDER BY count DESC
  `;

  return result || [];
}

export async function getRevenueSeries(
  stationId?: string,
  days = 30
): Promise<{ day: string; totalIqd: number }[]> {
  const dateLimit = new Date();
  dateLimit.setDate(dateLimit.getDate() - days);

  const result = await prisma.$queryRaw<
    { day: string; totalIqd: number }[]
  >`
    SELECT 
      TO_CHAR(created_at, 'YYYY-MM-DD') as day,
      SUM(fee_amount_iqd)::bigint as "totalIqd"
    FROM inspections
    WHERE created_at >= ${dateLimit}
      AND payment_status = 'COLLECTED'
      ${stationId ? Prisma.sql`AND station_id = ${stationId}` : Prisma.empty}
    GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
    ORDER BY day ASC
  `;

  if (!result) return [];
  return result.map((r) => ({
    day: r.day,
    totalIqd: Number(r.totalIqd) || 0,
  }));
}

export async function getInspectorPerformance(
  stationId?: string,
  days = 30
): Promise<{
  inspectorId: string;
  name: string;
  count: number;
  avgDurationMin: number;
  overrideCount: number;
}[]> {
  const dateLimit = new Date();
  dateLimit.setDate(dateLimit.getDate() - days);

  const result = await prisma.$queryRaw<
    {
      inspectorId: string;
      name: string;
      count: number;
      avgDurationMin: number;
      overrideCount: number;
    }[]
  >`
    SELECT 
      i.inspector_id as "inspectorId",
      u.full_name as name,
      COUNT(i.id)::int as count,
      AVG(EXTRACT(EPOCH FROM (i.updated_at - i.created_at)) / 60)::float as "avgDurationMin",
      COUNT(o.id)::int as "overrideCount"
    FROM inspections i
    JOIN users u ON i.inspector_id = u.id
    LEFT JOIN overrides o ON o.inspection_id = i.id
    WHERE i.created_at >= ${dateLimit}
    ${stationId ? Prisma.sql`AND i.station_id = ${stationId}` : Prisma.empty}
    GROUP BY i.inspector_id, u.full_name
    ORDER BY count DESC
  `;

  if (!result) return [];
  return result.map((r) => ({
    inspectorId: r.inspectorId,
    name: r.name,
    count: Number(r.count) || 0,
    avgDurationMin: parseFloat((Number(r.avgDurationMin) || 0).toFixed(1)),
    overrideCount: Number(r.overrideCount) || 0,
  }));
}
