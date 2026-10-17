import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { z } from 'zod';

/**
 * Loads `apps/api/.env` if it exists, before anything reads `process.env`.
 *
 * Resolved from this module rather than the working directory, so the key is
 * found whether the API is started from the repo root or from `apps/api`.
 * Real environment variables win: `loadEnvFile` does not overwrite them.
 */
const apiRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const envFile = resolve(apiRoot, '.env');

if (existsSync(envFile)) {
  process.loadEnvFile(envFile);
}

/** Used to encrypt connection secrets at rest; see the refinement below. */
const DEV_ENCRYPTION_KEY = 'dev-insecure-encryption-key';

/**
 * An http(s) URL with a default.
 *
 * Only the protocol is pinned. `z.url()` alone accepts `localhost:8123` — a
 * valid URL whose scheme happens to be `localhost`, and precisely the typo
 * worth catching — while constraining the hostname would reject `localhost`
 * and bare IPs, which is what these variables usually point at.
 */
function httpUrl(fallback: string) {
  return z
    .url({ protocol: /^https?$/, error: `must be an http(s) URL, e.g. ${fallback}` })
    .default(fallback);
}

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

    CLICKHOUSE_URL: httpUrl('http://localhost:8123'),
    PORT: z.coerce.number('must be a number').int().positive().default(8080),
    WEB_ORIGIN: httpUrl('http://localhost:5173'),
    DATABASE_PATH: z.string().min(1).default('data/app.db'),

    ENCRYPTION_KEY: z.string().min(1).optional(),

    /** Anthropic is the chat provider; see README for obtaining a key. */
    ANTHROPIC_API_KEY: z.string().min(1).optional(),
    CHAT_MODEL: z.string().min(1).default('claude-opus-5-5'),
    /** The schema-search sub-agent selects from a supplied list, so it runs small. */
    SEARCH_MODEL: z.string().min(1).default('claude-haiku-4-5-20251001'),
  })
  .superRefine((value, ctx) => {
    // The assistant is the point of the app, so a missing key is a startup
    // failure rather than a surprise 503 on the first message. Tests run
    // without one because they never reach Anthropic.
    if (!value.ANTHROPIC_API_KEY && value.NODE_ENV !== 'test') {
      ctx.addIssue({
        code: 'custom',
        path: ['ANTHROPIC_API_KEY'],
        message:
          'is required: the assistant cannot run without it. Create one at ' +
          'https://console.anthropic.com/settings/keys, then put it in apps/api/.env',
      });
    }

    // Outside production the fallback below keeps the app runnable out of the
    // box; with real credentials at stake there is no safe default.
    if (!value.ENCRYPTION_KEY && value.NODE_ENV === 'production') {
      ctx.addIssue({
        code: 'custom',
        path: ['ENCRYPTION_KEY'],
        message: 'is required in production: connection passwords are encrypted with it',
      });
    }
  })
  .transform((value) => ({
    ...value,
    // Anchored to the API package, not the working directory: `pnpm start`
    // runs from the repo root and `pnpm --filter api dev` from `apps/api`,
    // and both must open the same file rather than seed a second one.
    DATABASE_PATH: resolve(apiRoot, value.DATABASE_PATH),
    ENCRYPTION_KEY: value.ENCRYPTION_KEY ?? DEV_ENCRYPTION_KEY,
  }));

export type Env = z.infer<typeof envSchema>;

/**
 * Validates the environment, naming every variable that is wrong at once.
 *
 * Exported for tests; the module-level `env` is what the app uses. Failing
 * here means the process never starts, which is the point: a typo in `PORT`
 * should not surface as `NaN` three layers down.
 */
export function parseEnv(source: NodeJS.ProcessEnv): Env {
  const parsed = envSchema.safeParse(source);

  if (!parsed.success) {
    const problems = parsed.error.issues.map(
      (issue) => `  ${issue.path.join('.') || 'env'} ${issue.message}`,
    );

    throw new Error(`Invalid environment:\n${problems.join('\n')}`);
  }

  return parsed.data;
}

export const env = parseEnv(process.env);

if (env.ENCRYPTION_KEY === DEV_ENCRYPTION_KEY) {
  console.warn('[env] ENCRYPTION_KEY is not set; falling back to an insecure development key.');
}
