import { Hono } from 'hono';
import { z } from 'zod';

import { addConnection, listConnections, removeConnection } from '../lib/connections.js';

export const connectionRoutes = new Hono();

const optionalText = z
  .string()
  .trim()
  .transform((value) => value || undefined)
  .optional();

const connectionInputSchema = z.object({
  name: z.string().trim().min(1, "'name' is required"),
  url: z.string().trim().url("'url' must be a valid URL, e.g. http://localhost:8123"),
  username: optionalText,
  password: z.string().optional(),
  database: optionalText,
});

connectionRoutes.get('/connections', (c) => c.json({ connections: listConnections() }, 200));

connectionRoutes.post('/connections', async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = connectionInputSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.issues[0]?.message ?? 'Invalid connection' }, 400);
  }

  return c.json({ connection: addConnection(parsed.data) }, 201);
});

connectionRoutes.delete('/connections/:id', (c) => {
  const result = removeConnection(c.req.param('id'));

  if (!result.ok) {
    return c.json({ error: result.reason }, 400);
  }

  return c.json({ ok: true }, 200);
});
