import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

import { env } from '../env.js';
import * as schema from './schema.js';

mkdirSync(dirname(env.DATABASE_PATH), { recursive: true });

const sqlite = new Database(env.DATABASE_PATH);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

export const db = drizzle(sqlite, { schema });

/** Applies any pending migrations; safe to call on every boot. */
export function runMigrations(): void {
  // Resolved from this module so it works regardless of the working directory.
  const migrationsFolder = resolve(dirname(fileURLToPath(import.meta.url)), '../../drizzle');
  migrate(db, { migrationsFolder });
}
