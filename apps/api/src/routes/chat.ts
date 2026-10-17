import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from 'ai';
import { Hono } from 'hono';

import { env } from '../env.js';
import { closeStoppedToolCalls } from '../lib/stoppedTurn.js';
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
- You can run queries yourself, but only ones the user can see: \`run_query\`
  executes the editor's contents. To try a query of your own, write it to the
  editor first with an editing tool, then call \`run_query\`; pass
  \`statement\` (copied verbatim from the buffer) to highlight and run just one
  of several statements. It reads only; leave writes to the user.
- The console and your tools share one results panel: whatever \`run_query\`
  returns is already on the user's screen, in a table they can sort, page and
  export. Never reproduce those rows in your reply — no markdown tables, no
  lists of values. Summarise instead: how many rows, what they show, and
  anything notable, such as "9 employees, all in Sales except two managers".
  Quote a value only when it is the point of the answer, like a single total.
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

  // A turn the user stopped leaves tool calls without results; they are closed
  // here so the conversation can carry on from where it was interrupted.
  const messages = closeStoppedToolCalls(body.messages);

  // Stopping the chat closes the response, which aborts this; everything the
  // turn started — the model, the search sub-agent, its commands and sample
  // queries — hangs off this signal so it all stops together.
  const abortSignal = c.req.raw.signal;

  // The stream is built here rather than straight from the model so tools can
  // write to it: the schema search reports each step it takes as a data part.
  //
  // `originalMessages` matters when a client-side tool continues a turn: the
  // request arrives with the assistant message already half-written, and the
  // response has to carry that same message id so the browser replaces it.
  // Without it the continuation lands as a second message holding a copy of
  // the earlier parts, and every tool call shows up twice.
  const stream = createUIMessageStream({
    originalMessages: messages,
    execute: async ({ writer }) => {
      const tools = chatTools(c, writer, abortSignal);

      const result = streamText({
        model: anthropic(env.CHAT_MODEL),
        system: SYSTEM_PROMPT,
        tools,
        stopWhen: stepCountIs(MAX_STEPS),
        messages: await convertToModelMessages(messages, { tools }),
        abortSignal,
      });

      writer.merge(toUIMessageStream({ stream: result.stream, tools }));
    },
  });

  return createUIMessageStreamResponse({ stream });
});
