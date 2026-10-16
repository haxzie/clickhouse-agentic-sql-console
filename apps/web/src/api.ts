export type QueryRow = Record<string, unknown>;

export async function runQuery(query: string): Promise<QueryRow[]> {
  const response = await fetch('/api/query', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query }),
  });

  const payload = (await response.json()) as { rows?: QueryRow[]; error?: string };

  if (!response.ok) {
    throw new Error(payload.error ?? `Query failed with status ${response.status}`);
  }

  return payload.rows ?? [];
}
