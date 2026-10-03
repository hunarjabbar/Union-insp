# Union Inspection Architecture

This document describes the high-level architecture, module decomposition, and cryptographic security designs of the Union Inspection platform.

---

## 1. High-Level System Architecture Diagram

```
+----------------------------------------------------------------------------------------------------+
|                                    CLIENT APPLICATION TIERS                                        |
|                                                                                                    |
|  [Inspector Tablet / PWA]       [Station Manager POS / Web]       [Public Verification Portal]     |
|   - 3D Tire / Brake Intake       - ESC/POS WebUSB Thermal Print    - Offline QR Code Reader        |
|   - Offline-capable wizard       - Cash & Gateway QR Payments      - RSA-2048 Public Key Verify    |
+------------------------------------------------+---------------------------------------------------+
                                                 |
                                                 v
+----------------------------------------------------------------------------------------------------+
|                                      NEXT.JS 14 APP ROUTER                                         |
|                                                                                                    |
|  [ Edge Middleware ]                                                                               |
|   - JWT verification, station-bound RBAC routing, public webhook exemptions                        |
|                                                                                                    |
|  [ Server Actions Layer ]                                                                          |
|   - inspections.ts  (Intake, Countersign, Overrides)                                               |
|   - payments.ts     (Cash Collection, Gateway Initiation, Status Sync)                             |
|   - receipts.ts     (ESC/POS Encoding, PDF Generation, Reprint Audit)                              |
|   - ncrs.ts         (Non-Conformance Reports, Corrective Actions)                                  |
|                                                                                                    |
|  [ API Route Handlers ]                                                                            |
|   - /api/payments/webhooks/* (FastPay, ZainCash, FIB HMAC/JWT validation)                          |
|   - /api/payments/status/*   (Live POS polling fallback)                                           |
|   - /api/verify/*            (Public cryptographic inspection verification)                        |
|                                                                                                    |
|  [ Background Reconciler Worker ]                                                                  |
|   - scripts/run-reconciler.ts (Stale payment refresh, 24h orphan cleanup, drawer variance audit)   |
+------------------------------------------------+---------------------------------------------------+
                                                 |
                                                 v
+----------------------------------------------------------------------------------------------------+
|                                      DATA & SECURITY INFRASTRUCTURE                                |
|                                                                                                    |
|  [ PostgreSQL 16 + Prisma ORM ]                                                                    |
|   - 21 Data Models & 19 Enums with row-level station segmentation                                  |
|                                                                                                    |
|  [ Cryptographic Hash-Chain Engine ]                                                               |
|   - SHA-256 sequential block-linked immutable audit ledger                                         |
|                                                                                                    |
|  [ External Banking & POS Gateways ]                                                               |
|   - FastPay Merchant API | ZainCash API | First Iraqi Bank (FIB) | Physical Cash Register          |
+----------------------------------------------------------------------------------------------------+
```

---

## 2. Cryptographic Hash-Chain Write Path

To satisfy ISO/IEC 17020 Type A independence requirements and ISO 27001 tamper-evidence controls, all state transitions in Union Inspection are permanently committed through an immutable sequential SHA-256 hash-chain in `src/lib/audit.ts`.

### 2.1 Write Path Workflow

```
[ Domain Operation ] (e.g. createInspection, confirmCashPayment, overrideDefect)
        |
        v
[ Open Prisma Interactive Transaction ($transaction) ]
        |
        v
[ Query Previous Record in Transaction ]
  SELECT hash FROM audit_logs ORDER BY sequence DESC LIMIT 1 FOR UPDATE;
  -> previousHash = last.hash (or null for genesis block)
        |
        v
[ Construct Canonical JSON Payload ]
  Sort keys alphabetically, serialize nulls/numbers/dates deterministically
  payloadString = canonicalJSON({ userId, action, entityType, entityId, oldValues, newValues, timestamp })
        |
        v
[ Calculate New SHA-256 Hash ]
  hash = SHA-256( payloadString + (previousHash ?? '') )
        |
        v
[ Write Record to audit_logs ]
  INSERT INTO audit_logs (..., hash, previousHash, createdAt) VALUES (...)
        |
        v
[ Commit Transaction ] (Ensures atomic data state change + audit chain commitment)
```

### 2.2 Mathematical Invariants

1. **Sequential Chain Invariant**:
   For every entry $N > 1$:
   $$\text{previousHash}_N = \text{hash}_{N-1}$$

2. **Tamper Detection Invariant**:
   $$\text{hash}_N = \text{SHA256}(\text{canonicalJSON}(\text{Entry}_N) + \text{previousHash}_N)$$

Any modification, deletion, or out-of-order insertion in `audit_logs` invalidates all downstream hashes across the database. The integrity can be verified at any time via:

```bash
pnpm verify:chain
```
