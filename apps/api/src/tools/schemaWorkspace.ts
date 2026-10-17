import type { Context } from 'hono';

import { queryRows } from '../lib/clickhouse.js';
import { INTERNAL_DATABASES_SQL } from '../lib/databases.js';

/** Rebuilt rather than reused once stale; schemas change under us. */
const TTL_MS = 5 * 60 * 1000;

/** Where the files sit inside the sandbox, and the shell's working directory. */
export const WORKSPACE_DIR = '/schema';

/** Absolute path inside the sandbox -> file contents. */
export type SchemaFiles = Record<string, string>;

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

type CachedFiles = { files: SchemaFiles; builtAt: number };

const cache = new Map<string, CachedFiles>();

/**
 * The connection's schema as a set of files for the search sub-agent to
 * explore with bash. Everything is line-oriented and lives in predictable
 * paths, because the agent reaches for `grep` far more often than it reads a
 * whole file.
 *
 * These are handed to just-bash as a virtual filesystem rather than written to
 * disk: nothing the sub-agent runs touches the host, and a search cannot read
 * a path that was never put in the map.
 *
 * Cached per connection for a few minutes: a conversation usually runs several
 * searches, and re-dumping the schema each time is pure latency.
 */
export async function buildSchemaFiles(c: Context, connectionId: string): Promise<SchemaFiles> {
  const cached = cache.get(connectionId);

  if (cached && Date.now() - cached.builtAt < TTL_MS) {
    return cached.files;
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

  const files: SchemaFiles = {
    [`${WORKSPACE_DIR}/README.md`]: readme(),
    [`${WORKSPACE_DIR}/tables.tsv`]: tablesTsv(tables),
    [`${WORKSPACE_DIR}/columns.tsv`]: columnsTsv(columns),
  };

  for (const table of tables) {
    files[`${WORKSPACE_DIR}/ddl/${table.database}/${table.name}.sql`] = table.create_table_query;
  }

  cache.set(connectionId, { files, builtAt: Date.now() });

  return files;
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
