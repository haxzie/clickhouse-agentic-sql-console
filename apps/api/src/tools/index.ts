import { tool, type ToolSet } from 'ai';
import type { Context } from 'hono';
import { z } from 'zod';

import { errorMessage } from '../lib/clickhouse.js';
import { searchSchema } from './searchSchema.js';

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
export function chatTools(c: Context): ToolSet {
  return {
    search: tool({
      description:
        'Find tables and columns for a use case. Searches the connected database schema and ' +
        'returns matching tables, their relevant columns, and an instruction describing how to ' +
        'use them. Prefer this over guessing table or column names.',
      inputSchema: z.object({
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
      execute: async ({ use_case, database }) => {
        try {
          return await searchSchema(c, use_case, database);
        } catch (error) {
          return { error: errorMessage(error) };
        }
      },
    }),

    // --- Executed in the browser, which owns the editor buffer. ---

    get_editor_state: tool({
      description:
        'Read the SQL editor: the buffer with line numbers, the cursor position, the current ' +
        'selection, the dialect, and a version token. Call this before editing.',
      inputSchema: z.object({}),
    }),

    get_last_error: tool({
      description:
        'Read the error from the last failed query run in the console, with the statement that ' +
        'produced it. Use it when the user refers to "the error" without pasting it.',
      inputSchema: z.object({}),
    }),

    str_replace: tool({
      description:
        'Replace an exact, unique snippet in the editor. Preferred for changing part of a long ' +
        'query, because the surrounding formatting and comments survive.',
      inputSchema: z.object({
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
        text: z.string().describe('Replacement for the selected text.'),
        version,
      }),
    }),

    insert_at_cursor: tool({
      description: 'Insert text at the cursor without touching the rest of the buffer.',
      inputSchema: z.object({
        text: z.string().describe('Text to insert.'),
        version,
      }),
    }),

    set_query: tool({
      description:
        'Replace the entire buffer. Use for short queries or a fresh "write me a query that…"; ' +
        'for edits to a long query prefer str_replace so the user formatting survives.',
      inputSchema: z.object({
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
  'str_replace',
  'replace_selection',
  'insert_at_cursor',
  'set_query',
] as const;
