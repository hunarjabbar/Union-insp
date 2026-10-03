# ISO Standards Compliance Mapping

This document details the exact alignment between international standards requirements and the Union Inspection software architecture.

---

## 1. ISO/IEC 17020: Conformity Assessment — Requirements for the Operation of Various Types of Bodies Performing Inspection

| ISO/IEC 17020 Clause | Requirement Summary | Union Inspection Implementation | Verification File / Function |
|---|---|---|---|
| **4.1.2** | Impartiality of inspection personnel | Strict RBAC prevents inspectors from modifying pricing, payouts, or audit logs | `src/lib/rbac.ts` (`PERMISSION_MATRIX`) |
| **4.1.6** | Independence from commercial pressures | Lead inspector override requires documented justification and two-person authorization | `src/actions/inspections.ts` (`overrideDefect`) |
| **5.2.2** | Clear reporting lines and responsibilities | Seven distinct roles assigned to specific terminals with station-level data isolation | `src/lib/rbac.ts` (`requireStationAccess`) |
| **6.2.6** | Calibration and traceability of measurement equipment | System blocks inspection lane submission if any lane equipment exceeds calibration due date | `src/lib/iso/pass-fail.ts` |
| **7.1.5** | Traceability of inspection findings | Every vehicle inspection parameter (tread depth, brake imbalance, headlight lux) is cryptographically signed | `src/lib/qr.ts`, `src/lib/audit.ts` |
| **7.4.2** | Unique inspection identification | Automated generation of immutable `UI-YYYY-XXXXXX` inspection certificate numbers | `src/lib/utils.ts` (`generateInspectionCode`) |

---

## 2. ISO/IEC 27001: Information Security Management Systems

| ISO 27001 Annex A | Security Control | Union Inspection Implementation | Verification File / Function |
|---|---|---|---|
| **A.9.2.1** | User registration and access rights | Role-based authentication using Argon2id password hashing and session tracking | `src/lib/auth.ts`, `src/actions/users.ts` |
| **A.9.4.2** | Password management system | Strong password requirements, salt-based hashing, and TOTP Multi-Factor Authentication | `src/lib/auth.ts`, `src/lib/validation/auth.schema.ts` |
| **A.9.4.3** | Session time-outs | Short-lived 10-minute JWT access tokens with 7-day sliding refresh sessions | `src/lib/auth.ts` (`signAccessToken`) |
| **A.12.4.1** | Event logging and tamper-detection | Sequential cryptographic SHA-256 hash-chaining of all audit records preventing tampering | `src/lib/audit.ts` (`writeAudit`, `verifyChain`) |
| **A.12.4.3** | Administrator and operator logs | Automated logging of all administrative overrides, role modifications, and session revocations | `src/lib/audit.ts`, `src/actions/users.ts` |
| **A.14.2.8** | System security testing | Automated test suite enforcing authorization boundaries and tamper detection | `tests/unit/rbac.test.ts`, `tests/unit/qr.test.ts` |

---

## 3. ISO 9001: Quality Management Systems

| ISO 9001 Clause | Requirement Summary | Union Inspection Implementation | Verification File / Function |
|---|---|---|---|
| **7.1.5** | Monitoring and measuring resources | Tracking equipment status, serial numbers, models, and calibration expiry | `src/actions/equipment.ts` |
| **8.5.2** | Identification and traceability | Permanent linking of VIN, plate number, inspector ID, lane ID, and certificate QR payload | `prisma/schema.prisma` (`Inspection` model) |
| **8.7.1** | Control of nonconforming outputs | Automatic creation of Non-Conformance Reports (NCR) upon critical safety failures | `src/actions/ncrs.ts`, `src/lib/iso/pass-fail.ts` |
| **9.1.3** | Analysis and evaluation of performance | Daily station reports aggregating passed, failed, re-inspected, and financial totals | `src/actions/financial.ts`, `src/actions/inspections.ts` |
| **10.2** | Nonconformity and corrective action | Structured corrective and preventive action workflow (CAPA) with mandatory resolution sign-off | `src/actions/ncrs.ts` (`resolveNCR`, `closeNCR`) |

---

## 4. ISO 39001: Road Traffic Safety (RTS) Management Systems

| ISO 39001 Clause | Safety Target & Metric | Union Inspection Implementation | Verification File / Function |
|---|---|---|---|
| **6.2** | Commercial vehicle braking efficiency | Minimum 50% overall braking efficiency; max 30% axle imbalance threshold enforced | `src/lib/iso/pass-fail.ts` (`evaluateBrakeTest`) |
| **6.2** | Tire tread depth & sidewall integrity | Enforces minimum 1.6mm tread depth; any structural sidewall damage triggers critical failure | `src/lib/iso/pass-fail.ts` (`evaluateTireTest`) |
| **6.2** | Nighttime visibility and illumination | Evaluates low-beam and high-beam lux intensity and aim alignment | `src/lib/iso/pass-fail.ts` (`evaluateLightTest`) |
| **8.1** | Fleet roadworthiness monitoring | Calculates dynamic vehicle compliance score (0-100) per fleet operator based on inspection history | `prisma/schema.prisma` (`Vehicle.complianceScore`) |
