import { Hono } from 'hono';

import { errorMessage, queryRows } from '../lib/clickhouse.js';

export const schemaRoutes = new Hono();

const INTERNAL_DATABASES = ["'INFORMATION_SCHEMA'", "'information_schema'"].join(', ');

/** Databases with their table names. Columns are fetched lazily per table. */
schemaRoutes.get('/schema', async (c) => {
  try {
    // Databases are listed separately so empty ones still show up in the tree.
    const [databaseRows, tableRows] = await Promise.all([
      queryRows<{ name: string }>(
        c,
        `SELECT name
         FROM system.databases
         WHERE name NOT IN (${INTERNAL_DATABASES})
         ORDER BY name`,
      ),
      queryRows<{ database: string; name: string }>(
        c,
        `SELECT database, name
         FROM system.tables
         WHERE database NOT IN (${INTERNAL_DATABASES})
         ORDER BY database, name`,
      ),
    ]);

    const byDatabase = new Map<string, string[]>(databaseRows.map((row) => [row.name, []]));

    for (const row of tableRows) {
      byDatabase.get(row.database)?.push(row.name);
    }

    const databases = [...byDatabase].map(([name, tables]) => ({ name, tables }));

    return c.json({ databases }, 200);
  } catch (error) {
    return c.json({ error: errorMessage(error) }, 500);
  }
});

schemaRoutes.get('/schema/:database/:table/columns', async (c) => {
  try {
    const { database, table } = c.req.param();

    const columns = await queryRows<{ name: string; type: string }>(
      c,
      `SELECT name, type
       FROM system.columns
       WHERE database = {database: String} AND table = {table: String}
       ORDER BY position`,
      { database, table },
    );

    return c.json({ columns }, 200);
  } catch (error) {
    return c.json({ error: errorMessage(error) }, 500);
  }
});
