import { create } from 'zustand';

import { fetchColumns, fetchSchema } from '../lib/api.js';
import type { Column, Database } from '../types/index.js';

/** Key used for per-table column caches and expansion state. */
export const tableKey = (database: string, table: string) => `${database}.${table}`;

type SchemaState = {
  databases: Database[];
  columnsByTable: Record<string, Column[]>;
  expandedDatabases: string[];
  expandedTables: string[];
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
    // Expansion state and cached columns belong to the previous connection.
    set({
      isLoading: true,
      error: null,
      databases: [],
      columnsByTable: {},
      expandedDatabases: [],
      expandedTables: [],
    });

    try {
      const databases = await fetchSchema();
      set({ databases, isLoading: false });
    } catch (cause) {
      set({
        isLoading: false,
        error: cause instanceof Error ? cause.message : 'Failed to load schema',
      });
    }
  },

  toggleDatabase: (database) =>
    set((state) => ({ expandedDatabases: toggle(state.expandedDatabases, database) })),

  toggleTable: async (database, table) => {
    const key = tableKey(database, table);
    const wasExpanded = get().expandedTables.includes(key);

    set((state) => ({ expandedTables: toggle(state.expandedTables, key) }));

    // Columns are fetched once per table, on first expand.
    if (wasExpanded || get().columnsByTable[key]) {
      return;
    }

    set((state) => ({ loadingTables: [...state.loadingTables, key] }));

    try {
      const columns = await fetchColumns(database, table);
      set((state) => ({ columnsByTable: { ...state.columnsByTable, [key]: columns } }));
    } catch (cause) {
      set({ error: cause instanceof Error ? cause.message : 'Failed to load columns' });
    } finally {
      set((state) => ({ loadingTables: state.loadingTables.filter((item) => item !== key) }));
    }
  },
}));
