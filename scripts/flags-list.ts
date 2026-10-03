// FILE: scripts/flags-list.ts
// STAGE: 14
// UPDATED: 2026-10-03

import 'dotenv/config';
import { FLAGS, isEnabled } from '../src/lib/feature-flags';

function main() {
  console.log('| NAME | DEFAULT | ENV | EFFECTIVE | SOURCE |');
  console.log('|---|---|---|---|---|');

  for (const [key, defaultVal] of Object.entries(FLAGS)) {
    const envVarName = `UNION_FLAG_${key}`;
    const envVal = process.env[envVarName];
    const effective = isEnabled(key as keyof typeof FLAGS);
    const source = envVal !== undefined ? `ENV (${envVarName})` : 'DEFAULT';

    console.log(`| ${key} | ${defaultVal} | ${envVal ?? 'unset'} | ${effective} | ${source} |`);
  }
}

main();
