import { create } from 'zustand';

import type { EditPreview } from '../lib/editorTools.js';

/** A failing query handed to the assistant by the "Fix with AI" action. */
export type FixRequest = {
  sql: string;
  error: string;
  requestedAt: number;
};

/** How the assistant's edits reach the editor. */
export type EditApproval = 'ask' | 'always';

/** An edit waiting on the user, held until they approve or reject it. */
export type PendingEdit = {
  toolCallId: string;
  toolName: string;
  input: unknown;
  preview: EditPreview;
};

/**
 * Assistant state: the fix hand-off, the edit-approval preference, and the
 * edits themselves — those waiting on the user and those already applied,
 * the latter kept so the transcript can keep showing their diff.
 */
type AssistantState = {
  pendingFix: FixRequest | null;
  editApproval: EditApproval;
  pendingEdits: Record<string, PendingEdit>;
  appliedEdits: Record<string, EditPreview>;

  requestFix: (sql: string, error: string) => void;
  setEditApproval: (editApproval: EditApproval) => void;
  addPendingEdit: (edit: PendingEdit) => void;
  clearPendingEdit: (toolCallId: string) => void;
  recordAppliedEdit: (toolCallId: string, preview: EditPreview) => void;
  startNewChat: () => void;
};

export const useAssistantStore = create<AssistantState>((set) => ({
  pendingFix: null,
  editApproval: 'ask',
  pendingEdits: {},
  appliedEdits: {},

  requestFix: (sql, error) => set({ pendingFix: { sql, error, requestedAt: Date.now() } }),

  setEditApproval: (editApproval) => set({ editApproval }),

  addPendingEdit: (edit) =>
    set((state) => ({ pendingEdits: { ...state.pendingEdits, [edit.toolCallId]: edit } })),

  clearPendingEdit: (toolCallId) =>
    set((state) => {
      const { [toolCallId]: _removed, ...rest } = state.pendingEdits;
      return { pendingEdits: rest };
    }),

  recordAppliedEdit: (toolCallId, preview) =>
    set((state) => ({ appliedEdits: { ...state.appliedEdits, [toolCallId]: preview } })),

  // The approval preference is a setting, so it survives a new chat.
  startNewChat: () => set({ pendingFix: null, pendingEdits: {}, appliedEdits: {} }),
}));
