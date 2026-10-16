import { create } from 'zustand';

import type { SidePanelTab } from '../types/index.js';

type UiState = {
  sidePanelTab: SidePanelTab;
  setSidePanelTab: (tab: SidePanelTab) => void;
};

export const useUiStore = create<UiState>((set) => ({
  sidePanelTab: 'tables',
  setSidePanelTab: (sidePanelTab) => set({ sidePanelTab }),
}));
