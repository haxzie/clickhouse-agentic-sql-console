import { create } from 'zustand';

import { runQuery } from '../lib/api.js';
import { errorMessage } from '../lib/errors.js';
import type { QueryHistoryEntry, QueryRow } from '../types/index.js';

/**
 * Query execution and its history.
 *
 * `rows`/`error`/`durationMs` describe the most recent statement, and
 * `durationMs` doubles as the "a query has completed" flag that the results
 * panel uses to tell an empty result apart from a fresh session.
 */
type QueryState = {
  rows: QueryRow[];
  error: string | null;
  durationMs: number | null;
  isRunning: boolean;
  /** Newest first; one entry per statement, not per Run. */
  history: QueryHistoryEntry[];
  execute: (sql: string) => Promise<void>;
  clearHistory: () => void;
};

/**
 * Splits editor contents into runnable statements.
 *
 * Naive on purpose: a `;` inside a string literal or comment would split
 * wrongly. Swap in a real parser if that becomes a problem.
 */
export function splitStatements(sql: string): string[] {
  return sql
    .split(';')
    .map((statement) => statement.trim())
    .filter((statement) => statement !== '');
}

export const useQueryStore = create<QueryState>((set) => ({
  rows: [],
  error: null,
  durationMs: null,
  isRunning: false,
  history: [],

  execute: async (sql) => {
    const statements = splitStatements(sql);

    // Callers disable their controls when there is nothing to run.
    if (statements.length === 0) {
      return;
    }

    set({ isRunning: true, error: null });

    // Statements run in order and stop at the first failure; only the last
    // result set stays on screen, while every statement is recorded.
    for (const statement of statements) {
      const entry: QueryHistoryEntry = {
        id: crypto.randomUUID(),
        sql: statement,
        status: 'running',
        executedAt: Date.now(),
      };

      set((state) => ({ history: [entry, ...state.history] }));

      try {
        const { rows, durationMs } = await runQuery(statement);

        set((state) => ({
          rows,
          durationMs,
          error: null,
          history: updateEntry(state.history, entry.id, {
            status: 'success',
            durationMs,
            rowCount: rows.length,
          }),
        }));
      } catch (cause) {
        const message = errorMessage(cause, 'Query failed');

        set((state) => ({
          rows: [],
          durationMs: null,
          error: message,
          history: updateEntry(state.history, entry.id, { status: 'error', error: message }),
        }));

        break;
      }
    }

    set({ isRunning: false });
  },

  clearHistory: () => set({ history: [] }),
}));

function updateEntry(
  history: QueryHistoryEntry[],
  id: string,
  patch: Partial<QueryHistoryEntry>,
): QueryHistoryEntry[] {
  return history.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry));
}
