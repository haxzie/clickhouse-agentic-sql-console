import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from 'ai';
import { Hono } from 'hono';

import { env } from '../env.js';
import { anthropic } from '../lib/model.js';
import { chatTools } from '../tools/index.js';

export const chatRoutes = new Hono();

const SYSTEM_PROMPT = `You are a SQL assistant embedded in a ClickHouse query console.

You can read and edit the user's SQL editor, and search their schema.

Working rules:
- Use \`search\` before naming tables or columns you have not already seen in
  this conversation. Follow the \`instruction\` it returns.
- Call \`get_editor_state\` before any edit, and pass the \`version\` it returns
  to the editing tool. If an edit is rejected as stale, read the state again
  and retry against the fresh version.
- Prefer \`str_replace\` for changing part of a query so the user's formatting
  and comments survive. Use \`set_query\` only for short queries or a fresh
  rewrite, \`replace_selection\` when the request is about highlighted text, and
  \`insert_at_cursor\` to add something at the cursor.
- Every edit reports a \`validation\` field. If it says the query is invalid, fix
  it in the same turn rather than leaving the user with a broken buffer; the
  error text comes from the database and names the problem.
- When the user mentions "the error" without quoting it, call \`get_last_error\`
  to read the last failed run and the statement behind it.
- After editing, say briefly what changed; do not repeat the whole query.
- Prefer ClickHouse syntax and functions over generic ANSI SQL. When you show
  SQL in prose, put it in a \`\`\`sql fenced block.`;

/** Enough steps for search -> read state -> edit -> summarise, with slack. */
const MAX_STEPS = 12;

chatRoutes.post('/chat', async (c) => {
  if (!env.ANTHROPIC_API_KEY) {
    return c.json({ error: 'ANTHROPIC_API_KEY is not set on the API process.' }, 503);
  }

  const body = await c.req.json<{ messages?: UIMessage[] }>().catch(() => ({}) as never);

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return c.json({ error: "'messages' is required" }, 400);
  }

  const tools = chatTools(c);

  const result = streamText({
    model: anthropic(env.CHAT_MODEL),
    system: SYSTEM_PROMPT,
    tools,
    stopWhen: stepCountIs(MAX_STEPS),
    messages: await convertToModelMessages(body.messages, { tools }),
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream, tools }),
  });
});
