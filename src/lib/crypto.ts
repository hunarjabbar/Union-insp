// FILE: src/lib/crypto.ts
// STAGE: 3
// UPDATED: 2026-10-01
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

export function aesEncrypt(plain: string, key: Buffer): string {
  if (key.length !== 32) throw new Error('AES-256-GCM requires a 32-byte key.');
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64url');
}

export function aesDecrypt(cipherText: string, key: Buffer): string {
  if (key.length !== 32) throw new Error('AES-256-GCM requires a 32-byte key.');
  const buffer = Buffer.from(cipherText, 'base64url');
  if (buffer.length < IV_LENGTH + TAG_LENGTH) throw new Error('Invalid ciphertext length.');
  const iv = buffer.subarray(0, IV_LENGTH);
  const tag = buffer.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const encrypted = buffer.subarray(IV_LENGTH + TAG_LENGTH);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}

export function sha256Hex(input: string): string {
  return crypto.createHash('sha256').update(input, 'utf8').digest('hex');
}

export function keyFromEnv(name: string): Buffer {
  const val = process.env[name];
  if (!val) throw new Error(`Environment variable '${name}' is not set.`);
  let buf = Buffer.from(val, 'base64');
  if (buf.length !== 32) {
    const hexBuf = Buffer.from(val, 'hex');
    if (hexBuf.length === 32) {
      buf = hexBuf;
    } else {
      buf = crypto.createHash('sha256').update(val, 'utf8').digest();
    }
  }
  return buf;
}
