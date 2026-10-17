import { create } from 'zustand';

import { fetchColumns, fetchSchema } from '../lib/api.js';
import { errorMessage } from '../lib/errors.js';
import type { Column, Database } from '../types/index.js';

/** Identifies a table in the column cache and expansion lists. */
export const tableKey = (database: string, table: string) => `${database}.${table}`;

/**
 * The explorer tree for the active connection.
 *
 * Databases and their table names arrive in one request; columns are fetched
 * per table on first expand, because `system` alone has ~100 tables and
 * loading every column upfront would be wasteful.
 */
type SchemaState = {
  databases: Database[];
  /** Cached per table, keyed by `tableKey`. */
  columnsByTable: Record<string, Column[]>;
  expandedDatabases: string[];
  expandedTables: string[];
  /** Whole-tree load; `loadingTables` tracks individual column fetches. */
  isLoading: boolean;
  loadingTables: string[];
  error: string | null;
  loadSchema: () => Promise<void>;
  toggleDatabase: (database: string) => void;
  toggleTable: (database: string, table: string) => Promise<void>;
};

const toggle = (list: string[], value: string) =>
  list.includes(value) ? list.filter((item) => item !== value) : [...list, value];

export const useSchemaStore = create<SchemaState>((set, get) => ({
  databases: [],
  columnsByTable: {},
  expandedDatabases: [],
  expandedTables: [],
  isLoading: false,
  loadingTables: [],
  error: null,

  loadSchema: async () => {
    // Called on connection switches too, so cached columns and expansion
    // state are dropped: they describe the previous target.
    set({
      isLoading: true,
      error: null,
      databases: [],
      columnsByTable: {},
      expandedDatabases: [],
      expandedTables: [],
    });

    try {
      set({ databases: await fetchSchema(), isLoading: false });
    } catch (cause) {
      set({ isLoading: false, error: errorMessage(cause, 'Failed to load schema') });
    }
  },

  toggleDatabase: (database) =>
    set((state) => ({ expandedDatabases: toggle(state.expandedDatabases, database) })),

  toggleTable: async (database, table) => {
    const key = tableKey(database, table);
    const wasExpanded = get().expandedTables.includes(key);

    set((state) => ({ expandedTables: toggle(state.expandedTables, key) }));

    // Collapsing, or expanding something already cached, needs no request.
    if (wasExpanded || get().columnsByTable[key]) {
      return;
    }

    set((state) => ({ loadingTables: [...state.loadingTables, key] }));

    try {
      const columns = await fetchColumns(database, table);
      set((state) => ({ columnsByTable: { ...state.columnsByTable, [key]: columns } }));
    } catch (cause) {
      set({ error: errorMessage(cause, 'Failed to load columns') });
    } finally {
      set((state) => ({ loadingTables: state.loadingTables.filter((item) => item !== key) }));
    }
  },
}));
