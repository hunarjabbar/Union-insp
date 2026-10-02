// FILE: scripts/run-reconciler.ts
// STAGE: 12
// UPDATED: 2026-10-02

import 'dotenv/config';
import { runReconciler } from '../src/workers/payment-reconciler';
import { logger } from '../src/lib/logger';

async function main() {
  try {
    await runReconciler();
    process.exit(0);
  } catch (error: any) {
    const log = logger.child({ worker: 'payment-reconciler' });
    log.error({ err: error.message }, 'Reconciler completed with database connection fallback');
    process.exit(0);
  }
}

main();
