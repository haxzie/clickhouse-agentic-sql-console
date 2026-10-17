import { mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import type { Context } from 'hono';

import { queryRows } from '../lib/clickhouse.js';
import { INTERNAL_DATABASES_SQL } from '../lib/databases.js';

/** Rebuilt rather than reused once stale; schemas change under us. */
const TTL_MS = 5 * 60 * 1000;

const ROOT = join(tmpdir(), 'clickhouse-ai-schema');

type TableRow = {
  database: string;
  name: string;
  engine: string;
  total_rows: string;
  create_table_query: string;
};

type ColumnRow = {
  database: string;
  table: string;
  name: string;
  type: string;
  comment: string;
};

const builtAt = new Map<string, number>();

/**
 * Writes the connection's schema to a directory the search agent explores with
 * bash. Everything is line-oriented and lives in predictable paths, because
 * the agent reaches for `grep` far more often than it reads a whole file.
 *
 * Cached per connection for a few minutes: a conversation usually runs several
 * searches, and re-dumping the schema each time is pure latency.
 */
export async function buildSchemaWorkspace(c: Context, connectionId: string): Promise<string> {
  const dir = join(ROOT, encodeURIComponent(connectionId));
  const builtAgo = Date.now() - (builtAt.get(dir) ?? 0);

  if (builtAgo < TTL_MS) {
    return dir;
  }

  const [tables, columns] = await Promise.all([
    queryRows<TableRow>(
      c,
      `SELECT database, name, engine, toString(total_rows) AS total_rows, create_table_query
       FROM system.tables
       WHERE database NOT IN (${INTERNAL_DATABASES_SQL})
       ORDER BY database, name`,
    ),
    queryRows<ColumnRow>(
      c,
      `SELECT database, table, name, type, comment
       FROM system.columns
       WHERE database NOT IN (${INTERNAL_DATABASES_SQL})
       ORDER BY database, table, position`,
    ),
  ]);

  await rm(dir, { recursive: true, force: true });
  await mkdir(join(dir, 'ddl'), { recursive: true });

  await Promise.all([
    writeFile(join(dir, 'README.md'), readme(), 'utf8'),
    writeFile(join(dir, 'tables.tsv'), tablesTsv(tables), 'utf8'),
    writeFile(join(dir, 'columns.tsv'), columnsTsv(columns), 'utf8'),
    ...(await writeDdl(dir, tables)),
  ]);

  builtAt.set(dir, Date.now());

  return dir;
}

async function writeDdl(dir: string, tables: TableRow[]): Promise<Promise<void>[]> {
  const databases = [...new Set(tables.map((table) => table.database))];

  await Promise.all(
    databases.map((database) => mkdir(join(dir, 'ddl', database), { recursive: true })),
  );

  return tables.map((table) =>
    writeFile(
      join(dir, 'ddl', table.database, `${table.name}.sql`),
      table.create_table_query,
      'utf8',
    ),
  );
}

function tablesTsv(tables: TableRow[]): string {
  const header = '# database\ttable\tengine\trows';
  const rows = tables.map((t) => `${t.database}\t${t.name}\t${t.engine}\t${t.total_rows}`);

  return [header, ...rows].join('\n');
}

function columnsTsv(columns: ColumnRow[]): string {
  const header = '# database\ttable\tcolumn\ttype\tcomment';
  const rows = columns.map(
    (c) => `${c.database}\t${c.table}\t${c.name}\t${c.type}\t${c.comment.replace(/\s+/g, ' ')}`,
  );

  return [header, ...rows].join('\n');
}

function readme(): string {
  return `# Schema workspace

Every file is tab-separated and one record per line, so grep is the fastest way in.

- tables.tsv   database, table, engine, row count
- columns.tsv  database, table, column, type, comment  <- start here
- ddl/<database>/<table>.sql  the CREATE TABLE statement, including keys and comments

Internal databases (system, INFORMATION_SCHEMA) are not included.
`;
}
