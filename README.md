# Union Inspection System (نظام فحص المركبات الموحد)

Production-grade vehicle roadworthiness inspection platform engineered for Iraq & KRG border terminals, city centers, and mobile inspection units. Compliant with ISO/IEC 17020 Type A inspection standards, ISO 27001, ISO 9001, and ISO 39001 road traffic safety governance.

---

## 1. ISO Compliance Table

| Standard | Scope / Clause | Union Inspection Implementation | Evidence & Audit Artifact |
|---|---|---|---|
| **ISO/IEC 17020** | 4.1 Impartiality & Independence | Cryptographic SHA-256 tamper-evident audit trail, two-person integrity on defect overrides | Canonical JSON hash-chain in `src/lib/audit.ts` |
| **ISO/IEC 17020** | 5.2 Type A Inspection Body | Station & inspector RBAC boundaries, immutable inspection code assignments | `src/lib/rbac.ts`, `src/actions/inspections.ts` |
| **ISO/IEC 17020** | 6.2 Equipment Calibration | Hard-block on inspection lanes if calibration grace period is exceeded | Calibration log checks in `src/lib/iso/pass-fail.ts` |
| **ISO 27001** | A.9 Access Control | Argon2id password hashing, TOTP MFA, 10-min JWT access tokens + rolling sessions | `src/lib/auth.ts`, `src/lib/rbac.ts` |
| **ISO 27001** | A.12 Cryptography | RSA-2048 digital signatures on QR codes, HMAC-SHA256 POS webhook validation | `src/lib/qr.ts`, `src/lib/payments/` |
| **ISO 9001** | 8.7 Nonconforming Outputs | Automated NCR creation on high financial variance (>5%) or safety defects | `src/workers/payment-reconciler.ts`, `src/actions/ncrs.ts` |
| **ISO 39001** | 6.2 Road Safety Targets | Automated brake imbalance (>30%) and tire tread depth (<1.6mm) failure thresholds | `src/lib/iso/pass-fail.ts` |

---

## 2. Quickstart

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment
cp .env.example .env

# 3. Generate RSA-2048 cryptographic signing keypair
pnpm prepare:keys

# 4. Migrate database and seed initial stations & credentials
pnpm prisma migrate deploy
pnpm prisma db seed

# 5. Start development server
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000) to access the inspection management dashboard.

---

## 3. Seeded Credentials Table

All accounts are provisioned with test credentials for staging and verification:

| Role | Email | Password | Station Assignment |
|---|---|---|---|
| **SUPER_ADMIN** | `admin@union.iq` | `AdminSecure2026!` | All Stations (System-wide) |
| **STATION_MANAGER** | `manager.erbil@union.iq` | `Manager2026!` | Erbil Central Terminal (`stn_erbil_01`) |
| **LEAD_INSPECTOR** | `lead.erbil@union.iq` | `LeadInsp2026!` | Erbil Central Terminal (`stn_erbil_01`) |
| **COMPLIANCE_AUDITOR** | `auditor@union.iq` | `Auditor2026!` | All Stations (Independent Audit) |
| **SYNDICATE_REPRESENTATIVE** | `syndicate@union.iq` | `Syndicate2026!` | All Stations (Financial Oversight) |
| **INSPECTION_TECHNICIAN** | `tech.erbil@union.iq` | `TechSecure2026!` | Erbil Central Terminal (`stn_erbil_01`) |
| **CASHIER** | `cashier.erbil@union.iq` | `Cashier2026!` (PIN: `1234`) | Erbil Central Terminal (`stn_erbil_01`) |

---

## 4. Role Matrix (RBAC)

The system enforces a 7-tier strict Role-Based Access Control matrix (`src/lib/rbac.ts`):

| Capability / Resource | SUPER_ADMIN | STATION_MANAGER | LEAD_INSPECTOR | COMPLIANCE_AUDITOR | SYNDICATE_REP | TECHNICIAN | CASHIER |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| User & System Admin | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Create Inspection | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Override Defect / Calibrate | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Verify Hash-Chain | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| Process Payment (Cash/POS) | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Print / Reprint Receipt | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |
| View Financial Ledgers | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ |

---

## 5. Scripts Table

| Command | Script Path | Description |
|---|---|---|
| `pnpm dev` | `next dev` | Start Next.js App Router local development server on port 3000 |
| `pnpm build` | `next build` | Compile Next.js production bundle with strict TypeScript verification |
| `pnpm test` | `vitest run` | Execute unit and integration tests with coverage tracking |
| `pnpm test:e2e` | `playwright test` | Execute Playwright end-to-end browser tests |
| `pnpm prepare:keys` | `scripts/gen-keys.ts` | Generate RSA-2048 signing & verification PEM keys in `./keys` |
| `pnpm verify:chain` | `scripts/verify-chain.ts` | Cryptographically verify the sequential SHA-256 audit log hash-chain |
| `pnpm flags:list` | `scripts/flags-list.ts` | Output markdown table of all 11 feature flags, defaults, and active values |
| `pnpm worker:reconciler` | `scripts/run-reconciler.ts` | Execute daily financial reconciliation worker for POS gateway transactions |

---

## 6. Environment Variables

| Variable | Required | Default | Description |
|---|:---:|---|---|
| `DATABASE_URL` | Yes | - | PostgreSQL 16 connection string with schema search path |
| `JWT_SECRET` | Yes | - | 256-bit secret for signing short-lived access JWTs (10 min) |
| `JWT_REFRESH_SECRET` | Yes | - | 256-bit secret for signing rolling refresh tokens (7 days) |
| `QR_SIGNING_KEY_PATH` | No | `./keys/qr-private.pem` | Path to RSA private key for QR certificate signing |
| `QR_VERIFICATION_PUBLIC_KEY_PATH` | No | `./keys/qr-public.pem` | Path to RSA public key for verification portal |
| `UNION_FLAG_*` (11 flags) | No | `0` | Feature toggle flags (see `scripts/flags-list.ts`) |
| `FASTPAY_*`, `ZAINCASH_*`, `FIB_*` | No | - | Credentials for Iraqi POS payment gateway integrations |

---

## 7. POS Onboarding

The system supports Iraqi electronic payment gateways alongside physical cash collection:
1. **FastPay**: Dynamic QR generation, HMAC-SHA256 webhook signatures, and direct redirect handling.
2. **ZainCash**: Secure tokenized transaction initiation and redirect callbacks.
3. **First Iraqi Bank (FIB)**: API payment creation, server-to-server webhook callbacks, and deep linking.
4. **Idempotency**: All payment transactions enforce unique `idempotencyKey` constraints to prevent duplicate billing.
5. **Reconciliation**: Automated nightly reconciliation matches daily register drawer totals against bank gateway settlements; variances >5% automatically create high-severity NCR non-conformance records.

---

## 8. Printing Support

- **ESC/POS WebUSB**: Direct thermal printing (58mm and 80mm) with hardware ESC/POS encoding.
- **Client-side PDF Fallback**: Portable receipts rendered via `@react-pdf/renderer` with high-density QR verification codes.
- **Reprint Audit**: Any reprint request mandates a documented operational justification, tracked via `reprintCount` and signed audit logs.

For detailed hardware specifications, see [docs/printing.md](docs/printing.md).

---

## 9. Architecture

For full architectural topology and cryptographic hash-chain write paths, refer to:
- [docs/architecture.md](docs/architecture.md)
- [docs/iso-mapping.md](docs/iso-mapping.md)
- [docs/payments.md](docs/payments.md)

---

## 10. Known Limitations

1. **WebUSB Driver Requirements**: Chrome/Chromium 89+ is required for WebUSB thermal printing. On Linux, appropriate `udev` rules must grant write access to printer USB endpoints.
2. **Offline Mode**: Full offline inspection queue syncing requires enabling `UNION_FLAG_OFFLINE_MODE` and registering local IndexedDB service workers.
