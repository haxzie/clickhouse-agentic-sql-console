import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';

import { env } from '../env.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const SALT = 'clickhouse-ai-connection-secrets';

const key = scryptSync(env.ENCRYPTION_KEY, SALT, 32);

/** Returns `iv:authTag:ciphertext`, all base64. */
export function encrypt(plainText: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);

  return [iv, cipher.getAuthTag(), encrypted].map((part) => part.toString('base64')).join(':');
}

export function decrypt(payload: string): string {
  const [iv, authTag, encrypted] = payload.split(':');

  if (!iv || !authTag || !encrypted) {
    throw new Error('Malformed encrypted payload');
  }

  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(iv, 'base64'));
  decipher.setAuthTag(Buffer.from(authTag, 'base64'));

  return Buffer.concat([
    decipher.update(Buffer.from(encrypted, 'base64')),
    decipher.final(),
  ]).toString('utf8');
}
