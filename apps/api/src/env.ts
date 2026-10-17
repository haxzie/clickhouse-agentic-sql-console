import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Loads `apps/api/.env` if it exists, before anything reads `process.env`.
 *
 * Resolved from this module rather than the working directory, so the key is
 * found whether the API is started from the repo root or from `apps/api`.
 * Real environment variables win: `loadEnvFile` does not overwrite them.
 */
const envFile = resolve(dirname(fileURLToPath(import.meta.url)), '../.env');

if (existsSync(envFile)) {
  process.loadEnvFile(envFile);
}

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

/** Anthropic is the chat provider; see README for obtaining a key. */
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const CHAT_MODEL = process.env.CHAT_MODEL ?? 'claude-opus-5-5';
/** The schema-search sub-agent selects from a supplied list, so it runs small. */
const SEARCH_MODEL = process.env.SEARCH_MODEL ?? 'claude-haiku-4-5-20251001';

if (!ANTHROPIC_API_KEY) {
  console.warn(
    '[env] ANTHROPIC_API_KEY is not set; the assistant will return 503 until it is. ' +
      `Put it in ${envFile} or export it before starting the API.`,
  );
}

export const env = {
  CLICKHOUSE_URL,
  PORT,
  WEB_ORIGIN,
  DATABASE_PATH,
  ENCRYPTION_KEY,
  ANTHROPIC_API_KEY,
  CHAT_MODEL,
  SEARCH_MODEL,
};
