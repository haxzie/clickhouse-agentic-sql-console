import type { Column, Connection, ConnectionDraft, Database, QueryRow } from '../types/index.js';

/**
 * Set by the connection store so every request targets the active connection.
 * Kept out of React state deliberately: it is transport detail, not UI state.
 */
let activeConnectionId: string | null = null;

export function setActiveConnectionId(id: string | null): void {
  activeConnectionId = id;
}

/**
 * The header that tells the API which connection to use.
 *
 * Exported because the chat stream is fetched by the AI SDK's transport rather
 * than through `request`, and it has to target the same connection as
 * everything else — otherwise the assistant reads a different database than
 * the one on screen.
 */
export function connectionHeaders(): Record<string, string> {
  return activeConnectionId ? { 'x-connection-id': activeConnectionId } : {};
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers({ ...connectionHeaders(), ...headersOf(init) });

  const response = await fetch(`/api${path}`, { ...init, headers });
  const payload = (await response.json()) as T & { error?: string };

  if (!response.ok) {
    throw new Error(payload.error ?? `Request failed with status ${response.status}`);
  }

  return payload;
}

/** `RequestInit['headers']` in a form that spreads. */
function headersOf(init?: RequestInit): Record<string, string> {
  return Object.fromEntries(new Headers(init?.headers).entries());
}

export function runQuery(sql: string): Promise<{ rows: QueryRow[]; durationMs: number }> {
  return request('/query', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query: sql }),
  });
}

export async function fetchSchema(): Promise<Database[]> {
  const { databases } = await request<{ databases: Database[] }>('/schema');
  return databases;
}

export async function fetchColumns(database: string, table: string): Promise<Column[]> {
  const { columns } = await request<{ columns: Column[] }>(
    `/schema/${encodeURIComponent(database)}/${encodeURIComponent(table)}/columns`,
  );

  return columns;
}

export async function fetchConnections(): Promise<Connection[]> {
  const { connections } = await request<{ connections: Connection[] }>('/connections');
  return connections;
}

export async function createConnection(draft: ConnectionDraft): Promise<Connection> {
  const { connection } = await request<{ connection: Connection }>('/connections', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(draft),
  });

  return connection;
}

export async function deleteConnection(id: string): Promise<void> {
  await request(`/connections/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export type SqlValidation =
  | { valid: true }
  | { valid: false; statement: string; error: string }
  /** The check itself could not run; the edit still happened. */
  | { valid: null; error: string };

export async function validateStatements(statements: string[]): Promise<SqlValidation> {
  if (statements.length === 0) {
    return { valid: true };
  }

  try {
    return await request<SqlValidation>('/validate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ statements }),
    });
  } catch (cause) {
    return { valid: null, error: cause instanceof Error ? cause.message : 'Validation failed' };
  }
}
