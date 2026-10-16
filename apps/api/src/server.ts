import { createClient } from '@clickhouse/client';
import { Hono } from 'hono';
import { cors } from 'hono/cors';

import { env } from './env.js';

const app = new Hono();

app.use('/*', cors({ origin: env.WEB_ORIGIN }));

// define a route handler for the default home page
app.get('/', (c) => c.text('Hello world!'));

app.post('/query', async (c) => {
  try {
    const clickhouseHeaders: Record<string, string> = {};
    for (const [key, value] of c.req.raw.headers) {
      if (key.startsWith('x-clickhouse-')) {
        clickhouseHeaders[key] = value;
      }
    }

    const body = await c.req.json<{ query?: unknown }>().catch(() => ({}) as { query?: unknown });

    if (typeof body.query !== 'string' || body.query.trim() === '') {
      return c.json({ error: "'query' is required" }, 400);
    }

    const client = createClient({ url: env.CLICKHOUSE_URL, http_headers: clickhouseHeaders });

    const resultSet = await client.query({ query: body.query, format: 'JSONEachRow' });
    const rows = await resultSet.json();

    return c.json({ rows }, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return c.json({ error: message }, 500);
  }
});

export default app;
