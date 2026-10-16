import { create } from 'zustand';

export type FixRequest = {
  sql: string;
  error: string;
  requestedAt: number;
};

type AssistantState = {
  /** Set when the user asks the assistant to fix a failing query. */
  pendingFix: FixRequest | null;
  requestFix: (sql: string, error: string) => void;
  clearFix: () => void;
  /** Resets the assistant back to an empty conversation. */
  startNewChat: () => void;
};

export const useAssistantStore = create<AssistantState>((set) => ({
  pendingFix: null,
  requestFix: (sql, error) => set({ pendingFix: { sql, error, requestedAt: Date.now() } }),
  clearFix: () => set({ pendingFix: null }),
  startNewChat: () => set({ pendingFix: null }),
}));
