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

    set({ isRunning: true });

    // The previous run stays on screen, dimmed, until the first new result
    // arrives: clearing up front flashes the empty state between runs. Results
    // accumulate here and replace the old set on the first commit.
    const next: QueryResult[] = [];

    const commit = (result: QueryResult) => {
      next.push(result);

      set((state) => ({
        results: [...next],
        // The first commit replaces a set the index may not fit; after that
        // only a failure moves the user, onto the statement that failed.
        activeResult: result.error ? next.length - 1 : next.length === 1 ? 0 : state.activeResult,
      }));
    };

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

        commit({ id: entry.id, sql: statement, rows, durationMs, error: null });

        set((state) => ({
          history: updateEntry(state.history, entry.id, {
            status: 'success',
            durationMs,
            rowCount: rows.length,
          }),
        }));
      } catch (cause) {
        const message = errorMessage(cause, 'Query failed');

        commit({ id: entry.id, sql: statement, rows: [], durationMs: null, error: message });

        set((state) => ({
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
