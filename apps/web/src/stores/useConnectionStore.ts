import { create } from 'zustand';

import {
  createConnection,
  deleteConnection,
  fetchConnections,
  setActiveConnectionId,
} from '../lib/api.js';
import type { Connection, ConnectionDraft } from '../types/index.js';
import { useSchemaStore } from './useSchemaStore.js';

export const EMPTY_DRAFT: ConnectionDraft = {
  name: '',
  url: 'http://localhost:8123',
  username: '',
  password: '',
  database: 'default',
};

type ConnectionState = {
  connections: Connection[];
  activeId: string | null;
  isPickerOpen: boolean;
  isModalOpen: boolean;
  isSaving: boolean;
  error: string | null;
  draft: ConnectionDraft;

  loadConnections: () => Promise<void>;
  setActive: (id: string) => void;
  remove: (id: string) => Promise<void>;
  save: () => Promise<void>;

  togglePicker: () => void;
  closePicker: () => void;
  openModal: () => void;
  closeModal: () => void;
  updateDraft: (field: keyof ConnectionDraft, value: string) => void;
};

export const useConnectionStore = create<ConnectionState>((set, get) => ({
  connections: [],
  activeId: null,
  isPickerOpen: false,
  isModalOpen: false,
  isSaving: false,
  error: null,
  draft: EMPTY_DRAFT,

  loadConnections: async () => {
    try {
      const connections = await fetchConnections();
      const activeId = get().activeId ?? connections[0]?.id ?? null;

      setActiveConnectionId(activeId);
      set({ connections, activeId, error: null });
    } catch (cause) {
      set({ error: cause instanceof Error ? cause.message : 'Failed to load connections' });
    }
  },

  setActive: (id) => {
    if (get().activeId === id) {
      set({ isPickerOpen: false });
      return;
    }

    setActiveConnectionId(id);
    set({ activeId: id, isPickerOpen: false });

    // The explorer is per-connection, so re-read it against the new target.
    void useSchemaStore.getState().loadSchema();
  },

  remove: async (id) => {
    try {
      await deleteConnection(id);

      const connections = get().connections.filter((connection) => connection.id !== id);
      set({ connections, error: null });

      if (get().activeId === id) {
        get().setActive(connections[0]?.id ?? '');
      }
    } catch (cause) {
      set({ error: cause instanceof Error ? cause.message : 'Failed to remove connection' });
    }
  },

  save: async () => {
    set({ isSaving: true, error: null });

    try {
      const connection = await createConnection(get().draft);

      set((state) => ({
        connections: [...state.connections, connection],
        isSaving: false,
        isModalOpen: false,
        draft: EMPTY_DRAFT,
      }));

      get().setActive(connection.id);
    } catch (cause) {
      set({
        isSaving: false,
        error: cause instanceof Error ? cause.message : 'Failed to add connection',
      });
    }
  },

  togglePicker: () => set((state) => ({ isPickerOpen: !state.isPickerOpen })),
  closePicker: () => set({ isPickerOpen: false }),
  openModal: () => set({ isModalOpen: true, isPickerOpen: false, error: null }),
  closeModal: () => set({ isModalOpen: false, draft: EMPTY_DRAFT, error: null }),
  updateDraft: (field, value) => set((state) => ({ draft: { ...state.draft, [field]: value } })),
}));
