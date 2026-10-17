import { create } from 'zustand';

/**
 * The SQL editor's contents, plus the selection state and version token the
 * assistant's editing tools depend on.
 *
 * `version` increments on every content change, whoever made it. A tool edit
 * carries the version it was planned against; if the user typed in the
 * meantime the version no longer matches and the edit is rejected rather than
 * applied to text the model never saw.
 */
type EditorState = {
  sql: string;
  version: number;
  /** Character offsets into `sql`; equal when the selection is empty. */
  selectionStart: number;
  selectionEnd: number;

  setSql: (sql: string) => void;
  setSelection: (start: number, end: number) => void;
};

export const useEditorStore = create<EditorState>((set) => ({
  sql: 'SELECT 1',
  version: 1,
  selectionStart: 0,
  selectionEnd: 0,

  setSql: (sql) =>
    set((state) => (sql === state.sql ? state : { sql, version: state.version + 1 })),

  setSelection: (selectionStart, selectionEnd) => set({ selectionStart, selectionEnd }),
}));
