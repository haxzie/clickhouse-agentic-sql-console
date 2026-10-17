import { Hono } from 'hono';
import { z } from 'zod';

import { errorMessage, queryText } from '../lib/clickhouse.js';

export const validateRoutes = new Hono();

const bodySchema = z.object({
  /** Already split by the caller, so both sides agree on statement boundaries. */
  statements: z.array(z.string()).min(1),
});

/**
 * Checks statements against the connected server with `EXPLAIN SYNTAX`, which
 * resolves names as well as parsing: it catches a misspelled keyword, a table
 * that does not exist and a column that does not exist, without running
 * anything.
 */
validateRoutes.post('/validate', async (c) => {
  const parsed = bodySchema.safeParse(await c.req.json().catch(() => null));

  if (!parsed.success) {
    return c.json({ error: "'statements' is required" }, 400);
  }

  for (const statement of parsed.data.statements) {
    if (statement.trim() === '') {
      continue;
    }

    try {
      await queryText(c, `EXPLAIN SYNTAX ${statement}`, 'TabSeparatedWithNames', {
        readonly: '2',
        max_execution_time: 5,
      });
    } catch (error) {
      return c.json({ valid: false, statement, error: tidy(errorMessage(error)) }, 200);
    }
  }

  return c.json({ valid: true }, 200);
});

/** ClickHouse errors carry a version suffix and stack noise the model does not need. */
function tidy(message: string): string {
  return message
    .replace(/\s*\(version [^)]+\)\s*$/, '')
    .split('\n')
    .slice(0, 3)
    .join('\n')
    .trim();
}
