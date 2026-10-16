import { Hono } from 'hono';

import { clientFor, errorMessage } from '../lib/clickhouse.js';

export const queryRoutes = new Hono();

queryRoutes.post('/query', async (c) => {
  try {
    const body = await c.req.json<{ query?: unknown }>().catch(() => ({}) as { query?: unknown });

    if (typeof body.query !== 'string' || body.query.trim() === '') {
      return c.json({ error: "'query' is required" }, 400);
    }

    const startedAt = performance.now();
    const resultSet = await clientFor(c).query({ query: body.query, format: 'JSONEachRow' });
    const rows = await resultSet.json();
    const durationMs = Math.round(performance.now() - startedAt);

    return c.json({ rows, durationMs }, 200);
  } catch (error) {
    return c.json({ error: errorMessage(error) }, 500);
  }
});
