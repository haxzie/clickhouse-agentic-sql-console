import { randomUUID } from 'node:crypto';

import { eq } from 'drizzle-orm';

import { db } from '../db/client.js';
import { connections, type ConnectionRow } from '../db/schema.js';
import { env } from '../env.js';
import { decrypt, encrypt } from './crypto.js';

export type Connection = {
  id: string;
  name: string;
  url: string;
  username?: string;
  password?: string;
  database?: string;
};

/** Connection without its secret, safe to send to the browser. */
export type PublicConnection = Omit<Connection, 'password'>;

export type ConnectionInput = Omit<Connection, 'id'>;

const DEFAULT_ID = 'default';

/** Seeds the env-configured connection the first time the app runs. */
export function seedDefaultConnection(): void {
  const existing = db.select().from(connections).limit(1).all();

  if (existing.length > 0) {
    return;
  }

  db.insert(connections)
    .values({
      id: DEFAULT_ID,
      name: 'Local ClickHouse',
      url: env.CLICKHOUSE_URL,
      database: 'default',
    })
    .run();
}

export function listConnections(): PublicConnection[] {
  return db.select().from(connections).all().map(toPublic);
}

export function getConnection(id?: string | null): Connection | undefined {
  const row = id
    ? db.select().from(connections).where(eq(connections.id, id)).get()
    : db.select().from(connections).limit(1).get();

  return row ? toConnection(row) : undefined;
}

export function addConnection(input: ConnectionInput): PublicConnection {
  const row: ConnectionRow = {
    id: randomUUID(),
    name: input.name,
    url: input.url,
    username: input.username ?? null,
    encryptedPassword: input.password ? encrypt(input.password) : null,
    database: input.database ?? null,
    createdAt: new Date(),
  };

  db.insert(connections).values(row).run();

  return toPublic(row);
}

export function removeConnection(id: string): { ok: true } | { ok: false; reason: string } {
  const existing = db.select().from(connections).where(eq(connections.id, id)).get();

  if (!existing) {
    return { ok: false, reason: 'Connection not found' };
  }

  if (db.select().from(connections).all().length === 1) {
    return { ok: false, reason: 'Cannot remove the only connection' };
  }

  db.delete(connections).where(eq(connections.id, id)).run();

  return { ok: true };
}

function toPublic(row: ConnectionRow): PublicConnection {
  return {
    id: row.id,
    name: row.name,
    url: row.url,
    username: row.username ?? undefined,
    database: row.database ?? undefined,
  };
}

function toConnection(row: ConnectionRow): Connection {
  return {
    ...toPublic(row),
    password: row.encryptedPassword ? decrypt(row.encryptedPassword) : undefined,
  };
}
