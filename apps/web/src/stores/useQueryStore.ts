import { create } from 'zustand';

import { runQuery } from '../lib/api.js';
import type { QueryHistoryEntry, QueryRow } from '../types/index.js';

type QueryState = {
  rows: QueryRow[];
  error: string | null;
  durationMs: number | null;
  isRunning: boolean;
  history: QueryHistoryEntry[];
  /** Splits on `;` so the editor can run several statements in one go. */
  execute: (sql: string) => Promise<void>;
  clearHistory: () => void;
};

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

    if (statements.length === 0) {
      set({ error: "'query' is required", rows: [], durationMs: null });
      return;
    }

    set({ isRunning: true, error: null });

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

        // Only the last statement's result set stays on screen.
        set((state) => ({
          rows,
          durationMs,
          error: null,
          history: state.history.map((item) =>
            item.id === entry.id
              ? { ...item, status: 'success', durationMs, rowCount: rows.length }
              : item,
          ),
        }));
      } catch (cause) {
        const message = cause instanceof Error ? cause.message : 'Query failed';

        set((state) => ({
          rows: [],
          durationMs: null,
          error: message,
          history: state.history.map((item) =>
            item.id === entry.id ? { ...item, status: 'error', error: message } : item,
          ),
        }));

        break;
      }
    }

    set({ isRunning: false });
  },

  clearHistory: () => set({ history: [] }),
}));
