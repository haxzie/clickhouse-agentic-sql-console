import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const connections = sqliteTable('connections', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  url: text('url').notNull(),
  username: text('username'),
  /** AES-256-GCM ciphertext; never returned to the browser. */
  encryptedPassword: text('encrypted_password'),
  database: text('database'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

export type ConnectionRow = typeof connections.$inferSelect;
export type NewConnectionRow = typeof connections.$inferInsert;
