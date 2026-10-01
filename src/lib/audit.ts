// FILE: src/lib/audit.ts
// STAGE: 3
// UPDATED: 2026-10-01
import { Prisma, PrismaClient } from '@prisma/client';
import { prisma } from './prisma';
import { sha256Hex } from './crypto';

export function canonicalJSON(obj: unknown): string {
  if (obj === null || obj === undefined) return JSON.stringify(null);
  if (typeof obj === 'object') {
    const constName = obj.constructor?.name;
    if (constName === 'DbNull' || constName === 'JsonNull' || constName === 'AnyNull') {
      return JSON.stringify(null);
    }
  }
  if (typeof obj !== 'object') return JSON.stringify(obj);
  if (Array.isArray(obj)) return `[${obj.map((item) => canonicalJSON(item)).join(',')}]`;
  const record = obj as Record<string, unknown>;
  const sortedKeys = Object.keys(record).sort();
  const entries = sortedKeys.map((key) => `${JSON.stringify(key)}:${canonicalJSON(record[key])}`);
  return `{${entries.join(',')}}`;
}

export async function writeAudit(params: {
  tx: Prisma.TransactionClient;
  userId: string | null;
  inspectionId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  oldValues?: unknown;
  newValues?: unknown;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  const { tx, userId, inspectionId, action, entityType, entityId, oldValues, newValues, ipAddress, userAgent } = params;
  const last = await tx.auditLog.findFirst({
    orderBy: { sequence: 'desc' },
    select: { hash: true },
  });
  const previousHash = last?.hash ?? null;
  const isoNow = new Date().toISOString();
  const payloadString = canonicalJSON({
    userId: userId ?? null,
    action,
    entityType,
    entityId: entityId ?? null,
    oldValues: oldValues ?? null,
    newValues: newValues ?? null,
    ipAddress: ipAddress ?? null,
    userAgent: userAgent ?? null,
    createdAt: isoNow,
  });
  const hash = sha256Hex(payloadString + (previousHash ?? ''));
  await tx.auditLog.create({
    data: {
      userId: userId ?? null,
      inspectionId: inspectionId ?? null,
      action,
      entityType,
      entityId: entityId ?? null,
      oldValues: (oldValues as Prisma.InputJsonValue) ?? Prisma.DbNull,
      newValues: (newValues as Prisma.InputJsonValue) ?? Prisma.DbNull,
      ipAddress: ipAddress ?? null,
      userAgent: userAgent ?? null,
      hash,
      previousHash,
      createdAt: new Date(isoNow),
    },
  });
}

export async function verifyChain(
  customClient?: PrismaClient | Prisma.TransactionClient
): Promise<{ valid: boolean; totalEntries: number; violations: string[] }> {
  const client = customClient ?? prisma;
  const logs = await client.auditLog.findMany({ orderBy: { sequence: 'asc' } });
  const violations: string[] = [];
  let previousHash: string | null = null;

  let verifiedCount = 0;
  for (const log of logs) {
    if (log.hash === 'SEED_PLACEHOLDER') {
      previousHash = log.hash;
      continue;
    }
    verifiedCount++;
    if (log.previousHash !== previousHash) {
      violations.push(`Sequence #${log.sequence} (ID: ${log.id}) previousHash mismatch. Expected: ${previousHash ?? 'null'}, Found: ${log.previousHash ?? 'null'}`);
    }
    const payloadString = canonicalJSON({
      userId: log.userId,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      oldValues: log.oldValues,
      newValues: log.newValues,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      createdAt: log.createdAt.toISOString(),
    });
    const expectedHash = sha256Hex(payloadString + (log.previousHash ?? ''));
    if (log.hash !== expectedHash) {
      violations.push(`Sequence #${log.sequence} (ID: ${log.id}) hash verification failed. Expected: ${expectedHash}, Stored: ${log.hash}`);
    }
    previousHash = log.hash;
  }
  return { valid: violations.length === 0, totalEntries: verifiedCount, violations };
}
