import type { Column, Connection, ConnectionDraft, Database, QueryRow } from '../types/index.js';

/**
 * Set by the connection store so every request targets the active connection.
 * Kept out of React state deliberately: it is transport detail, not UI state.
 */
let activeConnectionId: string | null = null;

export function setActiveConnectionId(id: string | null): void {
  activeConnectionId = id;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);

  if (activeConnectionId) {
    headers.set('x-connection-id', activeConnectionId);
  }

  const response = await fetch(`/api${path}`, { ...init, headers });
  const payload = (await response.json()) as T & { error?: string };

  if (!response.ok) {
    throw new Error(payload.error ?? `Request failed with status ${response.status}`);
  }

  return payload;
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
