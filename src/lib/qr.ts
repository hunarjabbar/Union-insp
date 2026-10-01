// FILE: src/lib/qr.ts
// STAGE: 3
// UPDATED: 2026-10-01
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const PRIVATE_KEY_PATH = process.env.QR_SIGNING_KEY_PATH || './keys/qr-private.pem';
const PUBLIC_KEY_PATH = process.env.QR_VERIFICATION_PUBLIC_KEY_PATH || './keys/qr-public.pem';

export function generateQrKeypairIfMissing(): void {
  const privResolved = path.resolve(process.cwd(), PRIVATE_KEY_PATH);
  const pubResolved = path.resolve(process.cwd(), PUBLIC_KEY_PATH);
  if (fs.existsSync(privResolved) && fs.existsSync(pubResolved)) return;
  const keysDir = path.dirname(privResolved);
  if (!fs.existsSync(keysDir)) fs.mkdirSync(keysDir, { recursive: true });
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  fs.writeFileSync(privResolved, privateKey, { mode: 0o600 });
  fs.writeFileSync(pubResolved, publicKey, { mode: 0o644 });
}

export interface InspectionQrPayload {
  inspectionCode: string;
  vehiclePlate: string;
  result: string;
  expiresAt: string;
  stationId: string;
}

export function signInspectionPayload(payload: InspectionQrPayload): { data: string; signature: string } {
  generateQrKeypairIfMissing();
  const privResolved = path.resolve(process.cwd(), PRIVATE_KEY_PATH);
  const privateKey = fs.readFileSync(privResolved, 'utf8');
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signer = crypto.createSign('SHA256');
  signer.update(data);
  const signature = signer.sign(privateKey, 'base64url');
  return { data, signature };
}

export function verifyInspectionPayload(data: string, signature: string): InspectionQrPayload | null {
  try {
    generateQrKeypairIfMissing();
    const pubResolved = path.resolve(process.cwd(), PUBLIC_KEY_PATH);
    const publicKey = fs.readFileSync(pubResolved, 'utf8');
    const verifier = crypto.createVerify('SHA256');
    verifier.update(data);
    const isValid = verifier.verify(publicKey, signature, 'base64url');
    if (!isValid) return null;
    const jsonString = Buffer.from(data, 'base64url').toString('utf8');
    const parsed = JSON.parse(jsonString) as InspectionQrPayload;
    if (!parsed.inspectionCode || !parsed.vehiclePlate || !parsed.result || !parsed.expiresAt || !parsed.stationId) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
