// FILE: scripts/gen-keys.ts
// STAGE: 2
// UPDATED: 2026-10-01
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

function main() {
  const keysDir = path.resolve(process.cwd(), 'keys');
  if (!fs.existsSync(keysDir)) {
    fs.mkdirSync(keysDir, { recursive: true });
  }

  const privateKeyPath = path.join(keysDir, 'qr-private.pem');
  const publicKeyPath = path.join(keysDir, 'qr-public.pem');

  if (fs.existsSync(privateKeyPath) && fs.existsSync(publicKeyPath)) {
    console.log('Keys already exist.');
    return;
  }

  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
  });

  fs.writeFileSync(privateKeyPath, privateKey, { mode: 0o600 });
  fs.writeFileSync(publicKeyPath, publicKey, { mode: 0o644 });
  console.log('Keys generated successfully.');
}

main();
