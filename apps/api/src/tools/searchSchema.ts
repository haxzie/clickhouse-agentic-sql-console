import { generateText, Output, stepCountIs, tool } from 'ai';
import type { Context } from 'hono';
import { z } from 'zod';

import { env } from '../env.js';
import { anthropic } from '../lib/model.js';
import { runSample } from './runSql.js';
import { runInSandbox } from './sandboxBash.js';
import { buildSchemaWorkspace } from './schemaWorkspace.js';

export const searchResultSchema = z.object({
  matches: z
    .array(
      z.object({
        database: z.string(),
        table: z.string(),
        columns: z.array(
          z.object({
            name: z.string(),
            type: z.string(),
            reason: z.string().describe('Why this column fits the use case'),
          }),
        ),
      }),
    )
    .describe('Tables and columns that serve the use case, most relevant first'),
  instruction: z
    .string()
    .describe(
      'What the calling agent should do next with these columns: which to select, join or ' +
        'filter on, and any caveat worth knowing.',
    ),
});

export type SearchResult = z.infer<typeof searchResultSchema>;

/** One thing the sub-agent did, reported as it happens. */
export type SearchStep = { tool: 'bash' | 'run_sql'; detail: string };

/** Enough turns to grep, narrow, read some DDL, sample a column and answer. */
const MAX_STEPS = 14;

const SYSTEM_PROMPT = `You find the tables and columns that serve a data use case in a
ClickHouse database.

You have two tools.

\`bash\` explores the schema, which has been written to files in your working directory.
It runs read-only commands (ls, cat, grep, head, find, wc, sort, uniq, cut, awk, sed, tr,
column, nl) optionally joined by \`|\`. There is no network and no writes.

\`run_sql\` samples the data itself, so you can confirm what a column actually holds
rather than trusting its name. It is read-only, returns at most 50 rows, and times out
after 5 seconds. Use it for small probes, not to answer the user's question:

     SELECT DISTINCT currency FROM default.orders LIMIT 20
     SELECT min(placed_at), max(placed_at) FROM default.orders
     SELECT count() AS rows, countIf(email = '') AS blank FROM default.customers
     SELECT plan, count() FROM default.customers GROUP BY plan ORDER BY 2 DESC

Do not build the final analytical query here; the calling agent does that.

Layout:
  README.md     how to read the workspace
  tables.tsv    database, table, engine, row count
  columns.tsv   database, table, column, type, comment   <- usually the fastest way in
  ddl/<database>/<table>.sql   CREATE TABLE, including ordering keys and comments

How to work:
1. Grep columns.tsv for words from the use case and their synonyms, case-insensitively.
   A use case about revenue might mean amount, price, total, value, gross or net.
     grep -i -E 'amount|price|revenue|total' columns.tsv
2. Once a table looks promising, read all of its columns before deciding.
   Match on fields rather than a regex, which works the same everywhere:
     awk -F'\\t' '$1 == "default" && $2 == "events"' columns.tsv
3. Read the DDL when ordering, partitioning or a comment matters:
     cat ddl/default/events.sql
4. Check it is worth querying at all:
     grep -i events tables.tsv
5. Sample a column when its meaning or shape matters — units, enum values, date
   coverage, how often it is empty. A column named \`amount\` could be minor units,
   and a \`status\` column is only useful once you know its values.

Prefer a small, precise answer over a broad one. Only report tables and columns you have
actually seen in the files; never guess a name. If nothing fits, return no matches and
say so in the instruction.`;

/**
 * Sub-agent: explores the schema workspace with bash and reports the tables
 * and columns that serve a use case, plus an instruction for the caller.
 *
 * Exploration beats a dumped schema here: wide ClickHouse databases do not fit
 * in a prompt, and grep over synonyms finds columns that a single-shot listing
 * would have truncated away.
 */
export async function searchSchema(
  c: Context,
  useCase: string,
  database: string | undefined,
  /** Called as the sub-agent works, so the UI can show its progress. */
  onStep: (step: SearchStep) => void = () => {},
): Promise<SearchResult | { error: string }> {
  const connectionId = c.req.header('x-connection-id') ?? 'default';
  const workspace = await buildSchemaWorkspace(c, connectionId);

  const runSql = tool({
    description:
      'Sample data from the connected ClickHouse database to confirm what a column holds. ' +
      'Read-only, capped at 50 rows and 5 seconds. For small probes (distinct values, ranges, ' +
      'null counts), not for answering the user question.',
    inputSchema: z.object({
      sql: z
        .string()
        .describe(
          'A single read-only statement, e.g. `SELECT DISTINCT currency FROM default.orders`',
        ),
    }),
    execute: ({ sql }) => {
      onStep({ tool: 'run_sql', detail: sql });
      return runSample(c, sql);
    },
  });

  const bash = tool({
    description:
      'Run a read-only shell command in the schema workspace. Commands may be joined with ' +
      '`|`. Writes, redirection, command substitution and network access are rejected.',
    inputSchema: z.object({
      command: z.string().describe('The command to run, e.g. `grep -i amount columns.tsv`'),
    }),
    execute: ({ command }) => {
      onStep({ tool: 'bash', detail: command });
      return runInSandbox(command, workspace);
    },
  });

  const scope = database
    ? `Restrict your search to the \`${database}\` database.`
    : 'Search every database in the workspace.';

  const { output } = await generateText({
    model: anthropic(env.SEARCH_MODEL),
    system: SYSTEM_PROMPT,
    prompt: `Use case: ${useCase}\n\n${scope}`,
    tools: { bash, run_sql: runSql },
    stopWhen: stepCountIs(MAX_STEPS),
    output: Output.object({ schema: searchResultSchema }),
  });

  return output;
}
