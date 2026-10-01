// FILE: tests/unit/hash-chain.test.ts
// STAGE: 4
// UPDATED: 2026-10-01
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { writeAudit, verifyChain } from '@/lib/audit';

interface MockAuditLog {
  sequence: number;
  id: string;
  userId: string | null;
  inspectionId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  oldValues: any;
  newValues: any;
  ipAddress: string | null;
  userAgent: string | null;
  hash: string;
  previousHash: string | null;
  createdAt: Date;
}

let store: MockAuditLog[] = [];
let nextSequence = 1;

// Mock the prisma dependency
vi.mock('@/lib/prisma', () => {
  return {
    prisma: {
      auditLog: {
        findFirst: vi.fn(async () => {
          if (store.length === 0) return null;
          const sorted = [...store].sort((a, b) => b.sequence - a.sequence);
          return sorted[0];
        }),
        create: vi.fn(async (params) => {
          const data = params.data;
          const newEntry: MockAuditLog = {
            sequence: nextSequence++,
            id: `cuid-${nextSequence}`,
            userId: data.userId || null,
            inspectionId: data.inspectionId || null,
            action: data.action,
            entityType: data.entityType,
            entityId: data.entityId || null,
            oldValues: data.oldValues || null,
            newValues: data.newValues || null,
            ipAddress: data.ipAddress || null,
            userAgent: data.userAgent || null,
            hash: data.hash,
            previousHash: data.previousHash || null,
            createdAt: data.createdAt || new Date(),
          };
          store.push(newEntry);
          return newEntry;
        }),
        findMany: vi.fn(async () => {
          return [...store].sort((a, b) => a.sequence - b.sequence);
        }),
      },
    },
  };
});

// A mock transaction client that delegates to the mocked prisma
const mockTx = {
  auditLog: {
    findFirst: async () => {
      if (store.length === 0) return null;
      const sorted = [...store].sort((a, b) => b.sequence - a.sequence);
      return sorted[0];
    },
    create: async (params: any) => {
      const data = params.data;
      const newEntry: MockAuditLog = {
        sequence: nextSequence++,
        id: `cuid-${nextSequence}`,
        userId: data.userId || null,
        inspectionId: data.inspectionId || null,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId || null,
        oldValues: data.oldValues || null,
        newValues: data.newValues || null,
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
        hash: data.hash,
        previousHash: data.previousHash || null,
        createdAt: data.createdAt || new Date(),
      };
      store.push(newEntry);
      return newEntry;
    },
  },
};

describe('audit hash-chain verification', () => {
  beforeEach(() => {
    store = [];
    nextSequence = 1;
    vi.clearAllMocks();
  });

  it('writes three audit entries with valid hash linkage', async () => {
    await writeAudit({
      tx: mockTx as any,
      userId: 'user-1',
      action: 'ACTION_1',
      entityType: 'VEHICLE',
      entityId: 'vehicle-1',
    });

    await writeAudit({
      tx: mockTx as any,
      userId: 'user-1',
      action: 'ACTION_2',
      entityType: 'VEHICLE',
      entityId: 'vehicle-1',
    });

    await writeAudit({
      tx: mockTx as any,
      userId: 'user-2',
      action: 'ACTION_3',
      entityType: 'VEHICLE',
      entityId: 'vehicle-1',
    });

    expect(store.length).toBe(3);
    expect(store[0].previousHash).toBeNull();
    expect(store[1].previousHash).toBe(store[0].hash);
    expect(store[2].previousHash).toBe(store[1].hash);

    const res = await verifyChain();
    expect(res.valid).toBe(true);
    expect(res.totalEntries).toBe(3);
    expect(res.violations.length).toBe(0);
  });

  it('detects tampering in the middle of the chain', async () => {
    await writeAudit({
      tx: mockTx as any,
      userId: 'user-1',
      action: 'ACTION_1',
      entityType: 'VEHICLE',
      entityId: 'vehicle-1',
    });

    await writeAudit({
      tx: mockTx as any,
      userId: 'user-1',
      action: 'ACTION_2',
      entityType: 'VEHICLE',
      entityId: 'vehicle-1',
    });

    await writeAudit({
      tx: mockTx as any,
      userId: 'user-2',
      action: 'ACTION_3',
      entityType: 'VEHICLE',
      entityId: 'vehicle-1',
    });

    expect(store.length).toBe(3);

    // Tamper with the middle entry
    store[1].action = 'TAMPERED_ACTION';

    const res = await verifyChain();
    expect(res.valid).toBe(false);
    expect(res.totalEntries).toBe(3);
    expect(res.violations.length).toBeGreaterThan(0);
  });

  it('skips seed placeholder rows', async () => {
    store.push({
      sequence: nextSequence++,
      id: 'cuid-seed',
      userId: null,
      inspectionId: null,
      action: 'DATABASE_INITIAL_SEED',
      entityType: 'SYSTEM',
      entityId: null,
      oldValues: null,
      newValues: null,
      ipAddress: null,
      userAgent: null,
      hash: 'SEED_PLACEHOLDER',
      previousHash: null,
      createdAt: new Date(),
    });

    await writeAudit({
      tx: mockTx as any,
      userId: 'user-1',
      action: 'ACTION_1',
      entityType: 'VEHICLE',
      entityId: 'vehicle-1',
    });

    await writeAudit({
      tx: mockTx as any,
      userId: 'user-1',
      action: 'ACTION_2',
      entityType: 'VEHICLE',
      entityId: 'vehicle-1',
    });

    expect(store.length).toBe(3);

    const res = await verifyChain();
    expect(res.valid).toBe(true);
    expect(res.totalEntries).toBe(2);
    expect(res.violations.length).toBe(0);
  });
});
