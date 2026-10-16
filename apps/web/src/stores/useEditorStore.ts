import { create } from 'zustand';

type EditorState = {
  sql: string;
  setSql: (sql: string) => void;
  /** Inserts a snippet (e.g. a table name clicked in the explorer) at the end. */
  appendSql: (snippet: string) => void;
};

export const useEditorStore = create<EditorState>((set) => ({
  sql: 'SELECT 1',
  setSql: (sql) => set({ sql }),
  appendSql: (snippet) =>
    set((state) => ({
      sql: state.sql.trimEnd() === '' ? snippet : `${state.sql.trimEnd()} ${snippet}`,
    })),
}));
