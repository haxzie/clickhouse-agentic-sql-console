import { createClient, type ClickHouseClient, type ClickHouseSettings } from '@clickhouse/client';
import type { Context } from 'hono';

import { getConnection } from './connections.js';

/**
 * Clients are created per request: the target server is chosen by the
 * `x-connection-id` header, and `x-clickhouse-*` headers are passed through.
 */
export function clientFor(c: Context): ClickHouseClient {
  const connection = getConnection(c.req.header('x-connection-id'));

  if (!connection) {
    throw new Error('No ClickHouse connection configured');
  }

  const httpHeaders: Record<string, string> = {};

  for (const [key, value] of c.req.raw.headers) {
    if (key.startsWith('x-clickhouse-')) {
      httpHeaders[key] = value;
    }
  }

  return createClient({
    url: connection.url,
    username: connection.username,
    password: connection.password,
    database: connection.database,
    http_headers: httpHeaders,
  });
}

export async function queryRows<T>(
  c: Context,
  query: string,
  queryParams?: Record<string, unknown>,
): Promise<T[]> {
  const resultSet = await clientFor(c).query({
    query,
    query_params: queryParams,
    format: 'JSONEachRow',
  });

  return resultSet.json<T>();
}

/**
 * Raw text result, for tool output that is read rather than parsed.
 *
 * `abortSignal` is forwarded to ClickHouse so a query the user has walked away
 * from stops costing the server something.
 */
export async function queryText(
  c: Context,
  query: string,
  format: 'TabSeparatedWithNames',
  clickhouseSettings?: ClickHouseSettings,
  abortSignal?: AbortSignal,
): Promise<string> {
  const resultSet = await clientFor(c).query({
    query,
    format,
    clickhouse_settings: clickhouseSettings,
    abort_signal: abortSignal,
  });

  return resultSet.text();
}

/** A new connection is not worth saving if nothing answers at the other end. */
const PROBE_TIMEOUT_MS = 5_000;

export type ProbeResult = { ok: true } | { ok: false; error: string };

/**
 * Checks a connection's details before they are stored.
 *
 * This runs against the details as given rather than a saved row: the point is
 * to tell the user their URL, credentials or database are wrong while the form
 * is still open, instead of saving a connection that cannot be used.
 */
export async function probeConnection(input: {
  url: string;
  username?: string;
  password?: string;
  database?: string;
}): Promise<ProbeResult> {
  const client = createClient({
    url: input.url,
    username: input.username,
    password: input.password,
    database: input.database,
    request_timeout: PROBE_TIMEOUT_MS,
  });

  try {
    await client.query({ query: 'SELECT 1', format: 'JSONEachRow' });

    return { ok: true };
  } catch (error) {
    return { ok: false, error: connectionFailure(error) };
  } finally {
    await client.close();
  }
}

/**
 * Why a connection attempt failed, in words.
 *
 * A refused connection arrives as an `AggregateError` whose own message is
 * empty — one per address the host resolved to — so the code and the nested
 * errors carry the only description there is.
 */
function connectionFailure(error: unknown): string {
  const failure = error as { message?: string; code?: string; errors?: { message?: string }[] };
  const nested = failure.errors?.find((inner) => inner.message)?.message;
  const described = failure.message || nested || '';

  if (described && failure.code) {
    return `${described} (${failure.code})`;
  }

  return described || failure.code || 'the server did not respond';
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Internal server error';
}
