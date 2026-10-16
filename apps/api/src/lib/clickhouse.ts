import { createClient, type ClickHouseClient } from '@clickhouse/client';
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

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Internal server error';
}
