// FILE: src/lib/feature-flags.ts
// STAGE: 3
// UPDATED: 2026-10-01
export const FLAGS = {
  OFFLINE_MODE: false,
  FEDERATED_ANALYTICS: false,
  APPEALS_WORKFLOW: false,
  DEVICE_ATTESTATION: false,
  MFA_ENFORCEMENT: false,
  TWO_PERSON_INTEGRITY: false,
  LANE_PWA: false,
  PAYMENT_GATEWAY: false,
  POS_PAYMENTS: false,
  THERMAL_PRINT: false,
  V2_API: false,
} as const;

export function isEnabled(flag: keyof typeof FLAGS): boolean {
  const envVal = process.env[`UNION_FLAG_${flag}`];
  if (envVal === '1' || envVal === 'true') return true;
  if (envVal === '0' || envVal === 'false') return false;
  return FLAGS[flag];
}
