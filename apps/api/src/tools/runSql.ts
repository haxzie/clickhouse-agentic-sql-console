import type { Context } from 'hono';

import { errorMessage, queryText } from '../lib/clickhouse.js';

/** Statements that only read. Anything else is rejected before it is sent. */
const ALLOWED_PREFIXES = ['select', 'with', 'describe', 'desc', 'show', 'explain'];

/** Sampling means a handful of rows; the caller is not building a report. */
const ROW_LIMIT = 50;
const MAX_EXECUTION_SECONDS = 5;
const MAX_OUTPUT_CHARS = 4_000;

export type SampleResult = { rows: string } | { error: string };

/**
 * Checks a statement is a single read, and caps how much it can return.
 *
 * The cap is an explicit `LIMIT` wrap rather than `max_result_rows`: that
 * setting only breaks on block boundaries, and a `SELECT` over 1000 rows comes
 * back in full despite it.
 */
export function prepareSample(sql: string): { query: string } | { error: string } {
  const trimmed = sql.trim().replace(/;\s*$/, '');

  if (trimmed === '') {
    return { error: 'Empty query.' };
  }

  if (trimmed.includes(';')) {
    return { error: 'Rejected: one statement per call.' };
  }

  if (/\bformat\s+\w+\s*$/i.test(trimmed)) {
    return { error: 'Rejected: drop the FORMAT clause; results come back as TSV already.' };
  }

  const keyword = trimmed.split(/\s+/)[0]?.toLowerCase() ?? '';

  if (!ALLOWED_PREFIXES.includes(keyword)) {
    return {
      error:
        `Rejected: \`${keyword.toUpperCase()}\` is not allowed. This tool samples data; ` +
        `use SELECT, WITH, DESCRIBE, SHOW or EXPLAIN.`,
    };
  }

  // DESCRIBE/SHOW/EXPLAIN return small, fixed result sets already.
  const needsLimit = keyword === 'select' || keyword === 'with';

  return { query: needsLimit ? `SELECT * FROM (${trimmed}) LIMIT ${ROW_LIMIT}` : trimmed };
}

/**
 * Runs a read-only sample against the user's connection.
 *
 * `readonly = 2` is the authoritative guard — it refuses writes at the server
 * even if the statement check above is fooled — while still permitting the
 * per-query settings this sends.
 */
export async function runSample(
  c: Context,
  sql: string,
  abortSignal?: AbortSignal,
): Promise<SampleResult> {
  const prepared = prepareSample(sql);

  if ('error' in prepared) {
    return prepared;
  }

  try {
    const text = await queryText(
      c,
      prepared.query,
      'TabSeparatedWithNames',
      { readonly: '2', max_execution_time: MAX_EXECUTION_SECONDS },
      abortSignal,
    );

    const trimmed = text.trim();

    if (trimmed === '') {
      return { rows: '(no rows)' };
    }

    return {
      rows:
        trimmed.length > MAX_OUTPUT_CHARS
          ? `${trimmed.slice(0, MAX_OUTPUT_CHARS)}\n…truncated; select fewer columns or rows.`
          : trimmed,
    };
  } catch (error) {
    return { error: errorMessage(error) };
  }
}
