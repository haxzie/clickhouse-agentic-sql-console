import { generateObject } from 'ai';
import { Hono } from 'hono';
import { z } from 'zod';

import { env } from '../env.js';
import { errorMessage } from '../lib/clickhouse.js';
import { anthropic } from '../lib/model.js';

export const describeRoutes = new Hono();

/** A run with more tabs than this is unusual; the cap bounds the prompt. */
const MAX_STATEMENTS = 10;

const bodySchema = z.object({
  statements: z.array(z.string()).min(1).max(MAX_STATEMENTS),
});

const titlesSchema = z.object({
  titles: z.array(z.string()).describe('One title per statement, in the order they were given'),
});

const SYSTEM_PROMPT = `You label SQL statements for the tabs of a query console.

Give each statement a title of two to four words naming what it returns, in
sentence case, with no trailing punctuation. Describe the result, not the
syntax: "Order count", "Customers by country", "Top products by revenue",
"Recent failed orders". Never answer with "Query", "SQL" or "Select".

Return exactly as many titles as there are statements, in the same order.`;

/**
 * Names each statement so the results tabs can read as something other than
 * "Query 1". Small model, small output: this runs beside execution and the UI
 * works fine without it.
 */
describeRoutes.post('/describe', async (c) => {
  if (!env.ANTHROPIC_API_KEY) {
    return c.json({ error: 'ANTHROPIC_API_KEY is not set on the API process.' }, 503);
  }

  const parsed = bodySchema.safeParse(await c.req.json().catch(() => null));

  if (!parsed.success) {
    return c.json({ error: "'statements' is required" }, 400);
  }

  const { statements } = parsed.data;

  try {
    const { object } = await generateObject({
      model: anthropic(env.SEARCH_MODEL),
      schema: titlesSchema,
      system: SYSTEM_PROMPT,
      prompt: statements.map((sql, index) => `${index + 1}. ${sql}`).join('\n\n'),
    });

    // A short model can miscount; pad or trim so index alignment holds.
    const titles = statements.map((_, index) => object.titles[index]?.trim() || '');

    return c.json({ titles }, 200);
  } catch (error) {
    return c.json({ error: errorMessage(error) }, 500);
  }
});
