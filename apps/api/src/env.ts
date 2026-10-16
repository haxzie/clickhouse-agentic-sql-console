import { resolve } from 'node:path';

const CLICKHOUSE_URL = process.env.CLICKHOUSE_URL ?? 'http://localhost:8123';
const PORT = Number(process.env.PORT ?? 8080);
const WEB_ORIGIN = process.env.WEB_ORIGIN ?? 'http://localhost:5173';
const DATABASE_PATH = resolve(process.env.DATABASE_PATH ?? 'data/app.db');

/**
 * Used to encrypt connection secrets at rest. A development fallback keeps the
 * app runnable out of the box; production deployments must set their own.
 */
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY ?? 'dev-insecure-encryption-key';

if (!process.env.ENCRYPTION_KEY) {
  console.warn('[env] ENCRYPTION_KEY is not set; falling back to an insecure development key.');
}

export const env = { CLICKHOUSE_URL, PORT, WEB_ORIGIN, DATABASE_PATH, ENCRYPTION_KEY };
