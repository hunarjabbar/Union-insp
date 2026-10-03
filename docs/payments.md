# POS Payments, Webhooks & Financial Reconciliation

This document specifies the payment architecture, gateway integrations, idempotency controls, and daily drawer reconciliation in Union Inspection.

---

## 1. Supported Payment Providers

| Provider | Method Type | Initiation Pattern | Settlement Currency |
|---|---|---|---|
| **CASH** | Physical Drawer | Instant cashier confirmation via `confirmCashPayment` | IQD (Iraqi Dinar) |
| **FASTPAY** | Mobile Wallet & QR | Direct payment order API with dynamic QR display | IQD |
| **ZAINCASH** | Mobile Wallet | Tokenized transaction with redirect callback flow | IQD |
| **FIB (First Iraqi Bank)** | Digital Banking / QR | REST API invoice with webhook callback & deep link | IQD |

---

## 2. Idempotency Controls

To prevent duplicate billing across shaky 3G/4G network conditions at border checkpoints:
1. Every payment initiation generates a cryptographic unique `idempotencyKey` formatted as `PAY-{inspectionCode}-{provider}-{timestamp}`.
2. The `Payment` table enforces a `@unique` database constraint on `idempotencyKey`.
3. If an inspector or cashier retries payment submission with the same idempotency key, the server action rejects duplicate transaction attempts and safely returns the existing payment record.

---

## 3. Webhook Signature Verification

All external provider callbacks are routed through `/api/payments/webhooks/[provider]` or provider-specific endpoints.

### FastPay Webhook Verification
- Requires HMAC-SHA256 signature calculated over the raw request payload using `FASTPAY_STORE_PASSWORD`.
- Signature is passed in `x-fastpay-signature` or header parameters.

### ZainCash Webhook Verification
- Verified by decoding and verifying the payload JWT token with `ZAINCASH_SECRET`.

### FIB Webhook Verification
- Verified via FIB webhook secret signature header or mutual TLS / bearer token authorization.

All webhooks perform idempotent status updates: if the payment is already marked `COMPLETED`, the webhook safely acknowledges with 200 OK without re-triggering receipt creation or audit logging.

---

## 4. Nightly Reconciler Worker

The background worker (`src/workers/payment-reconciler.ts`) runs nightly via:
```bash
pnpm worker:reconciler
```

### Worker Tasks:
1. **Stale Payment Polling**: Queries all payments created between 10 minutes and 24 hours ago in `PENDING` or `PROCESSING` state and synchronizes with provider APIs.
2. **Orphan Expiration**: Marks any payment older than 24 hours without gateway settlement as `EXPIRED`.
3. **Drawer Financial Variance Check**:
   - Compares reported daily cash and digital revenue in `DailyReport` against actual gateway receipts.
   - If variance exceeds 5%, the reconciler automatically generates an ISO 9001 Non-Conformance Report (`NCR-REV-*`) flagged with `HIGH` severity.

---

## 5. Refunds & Overpayments

- Only users with `SUPER_ADMIN` authorization can initiate refunds via `refundPayment`.
- All refunds require documented justification and transactionally mark the inspection `paymentStatus` back to `UNPAID` while generating a signed SHA-256 audit entry.
