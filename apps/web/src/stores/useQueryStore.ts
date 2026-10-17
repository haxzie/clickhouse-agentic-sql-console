import { create } from 'zustand';

import { runQuery } from '../lib/api.js';
import { errorMessage } from '../lib/errors.js';
import { splitStatements } from '../lib/sql.js';
import type { QueryHistoryEntry, QueryResult } from '../types/index.js';

/**
 * Query execution, its results and its history.
 *
 * A run produces one result per statement, kept in order so the UI can tab
 * between them. `results` is empty until the first run completes, which is how
 * the panel tells "nothing run yet" from "ran and returned nothing".
 */
type QueryState = {
  results: QueryResult[];
  /** Index into `results`; the tab the user is looking at. */
  activeResult: number;
  isRunning: boolean;
  /** Newest first; one entry per statement, not per Run. */
  history: QueryHistoryEntry[];
  execute: (sql: string) => Promise<void>;
  setActiveResult: (index: number) => void;
  clearHistory: () => void;
};

export const useQueryStore = create<QueryState>((set) => ({
  results: [],
  activeResult: 0,
  isRunning: false,
  history: [],

  execute: async (sql) => {
    const statements = splitStatements(sql);

    // Callers disable their controls when there is nothing to run.
    if (statements.length === 0) {
      return;
    }

    set({ isRunning: true, results: [], activeResult: 0 });

    // Statements run in order and stop at the first failure. Every one of them
    // keeps its own result, so the UI can show them side by side.
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
          results: [
            ...state.results,
            { id: entry.id, sql: statement, rows, durationMs, error: null },
          ],
          history: updateEntry(state.history, entry.id, {
            status: 'success',
            durationMs,
            rowCount: rows.length,
          }),
        }));
      } catch (cause) {
        const message = errorMessage(cause, 'Query failed');

        set((state) => ({
          results: [
            ...state.results,
            { id: entry.id, sql: statement, rows: [], durationMs: null, error: message },
          ],
          // Show the statement that failed rather than leaving the user on a
          // successful tab from earlier in the run.
          activeResult: state.results.length,
          history: updateEntry(state.history, entry.id, { status: 'error', error: message }),
        }));

        break;
      }
    }

    set({ isRunning: false });
  },

  setActiveResult: (activeResult) => set({ activeResult }),

  clearHistory: () => set({ history: [] }),
}));

function updateEntry(
  history: QueryHistoryEntry[],
  id: string,
  patch: Partial<QueryHistoryEntry>,
): QueryHistoryEntry[] {
  return history.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry));
}
