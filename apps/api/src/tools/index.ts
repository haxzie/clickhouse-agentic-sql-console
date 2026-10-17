import { tool, type ToolSet, type UIMessageStreamWriter } from 'ai';
import type { Context } from 'hono';
import { z } from 'zod';

import { errorMessage } from '../lib/clickhouse.js';
import { searchSchema, type SearchStep } from './searchSchema.js';

/**
 * Shown to the user while the tool runs, so the assistant narrates itself
 * rather than the UI guessing from the tool name.
 */
const actionInfo = z
  .string()
  .describe(
    'A short, present-tense note on what you are doing and why, shown to the user while this ' +
      'tool runs. Six words or fewer, no trailing period. Examples: "Looking for revenue ' +
      'columns", "Checking the current query", "Tightening the WHERE clause", "Rewriting the ' +
      'query with a join".',
  );

/**
 * The version token the edit was planned against. Shared by every mutating
 * editor tool so a buffer the user has since typed into is never overwritten.
 *
 * Every applied edit comes back with a `validation` field: the resulting
 * buffer is checked against the server, so a broken query is reported in the
 * same step that broke it.
 */
const version = z
  .number()
  .int()
  .describe('The `version` from the most recent get_editor_state. The edit is rejected if stale.');

/**
 * Tools exposed to the chat model.
 *
 * `search` executes here, on the server, because it needs the ClickHouse
 * connection. The editor tools have no `execute`: the SDK forwards them to the
 * browser, which owns the buffer, and streams the result back.
 */
export function chatTools(
  c: Context,
  writer: UIMessageStreamWriter,
  abortSignal?: AbortSignal,
): ToolSet {
  return {
    search: tool({
      description:
        'Find tables and columns for a use case. Searches the connected database schema and ' +
        'returns matching tables, their relevant columns, and an instruction describing how to ' +
        'use them. Prefer this over guessing table or column names.',
      inputSchema: z.object({
        action_info: actionInfo,
        use_case: z
          .string()
          .describe(
            'What the data is needed for, in a sentence, e.g. "revenue per customer per month".',
          ),
        database: z
          .string()
          .optional()
          .describe('Restrict the search to one database. Omit to search all user databases.'),
      }),
      execute: async ({ use_case, database }, { toolCallId }) => {
        // Progress is written straight onto the message stream, keyed by the
        // tool call, so the UI can show the sub-agent working rather than
        // sitting on a spinner until it finishes.
        const steps: SearchStep[] = [];

        const onStep = (step: SearchStep) => {
          steps.push(step);
          writer.write({
            type: 'data-search-progress',
            id: toolCallId,
            data: { toolCallId, steps },
          });
        };

        try {
          return await searchSchema(c, use_case, database, onStep, abortSignal);
        } catch (error) {
          // A stopped turn is not a failure worth reporting back as one.
          return abortSignal?.aborted
            ? { error: 'Search stopped.' }
            : { error: errorMessage(error) };
        }
      },
    }),

    // --- Executed in the browser, which owns the editor buffer. ---

    get_editor_state: tool({
      description:
        'Read the SQL editor: the buffer with line numbers, the cursor position, the current ' +
        'selection, the dialect, and a version token. Call this before editing.',
      inputSchema: z.object({ action_info: actionInfo }),
    }),

    get_last_error: tool({
      description:
        'Read the error from the last failed query run in the console, with the statement that ' +
        'produced it. Use it when the user refers to "the error" without pasting it.',
      inputSchema: z.object({ action_info: actionInfo }),
    }),

    run_query: tool({
      description:
        'Run what is in the editor and read what comes back: columns, row counts, timings and a ' +
        'sample of rows. This runs the buffer, not SQL of your own: write the query to the ' +
        'editor first, then run it. Reads only — a statement that writes is refused and left ' +
        'for the user. Results appear in the console, so the user sees exactly what you ran.',
      inputSchema: z.object({
        action_info: actionInfo,
        statement: z
          .string()
          .optional()
          .describe(
            'One statement to run, copied verbatim from the editor; it is highlighted and run ' +
              "on its own. Omit to run the whole buffer (or the user's selection). Text that " +
              'is not already in the editor is refused.',
          ),
      }),
    }),

    str_replace: tool({
      description:
        'Replace an exact, unique snippet in the editor. Preferred for changing part of a long ' +
        'query, because the surrounding formatting and comments survive.',
      inputSchema: z.object({
        action_info: actionInfo,
        old_str: z
          .string()
          .describe('Exact text to replace, copied verbatim from the buffer. Must match once.'),
        new_str: z.string().describe('Replacement text.'),
        version,
      }),
    }),

    replace_selection: tool({
      description: "Replace the user's highlighted text. Use when the request is about it.",
      inputSchema: z.object({
        action_info: actionInfo,
        text: z.string().describe('Replacement for the selected text.'),
        version,
      }),
    }),

    insert_at_cursor: tool({
      description: 'Insert text at the cursor without touching the rest of the buffer.',
      inputSchema: z.object({
        action_info: actionInfo,
        text: z.string().describe('Text to insert.'),
        version,
      }),
    }),

    set_query: tool({
      description:
        'Replace the entire buffer. Use for short queries or a fresh "write me a query that…"; ' +
        'for edits to a long query prefer str_replace so the user formatting survives.',
      inputSchema: z.object({
        action_info: actionInfo,
        sql: z.string().describe('The complete new contents of the editor.'),
        version,
      }),
    }),
  };
}

/** Tool names the browser is responsible for executing. */
export const CLIENT_TOOL_NAMES = [
  'get_editor_state',
  'get_last_error',
  'run_query',
  'str_replace',
  'replace_selection',
  'insert_at_cursor',
  'set_query',
] as const;
