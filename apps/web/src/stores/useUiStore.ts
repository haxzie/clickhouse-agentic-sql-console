import { create } from 'zustand';

import type { SidePanelTab } from '../types/index.js';

/** Chrome state that no other store owns: currently just the explorer tabs. */
type UiState = {
  sidePanelTab: SidePanelTab;
  /** When false, long cell values are ellipsised on a single line. */
  wrapResultText: boolean;
  setSidePanelTab: (tab: SidePanelTab) => void;
  setWrapResultText: (wrapResultText: boolean) => void;
};

export const useUiStore = create<UiState>((set) => ({
  sidePanelTab: 'tables',
  wrapResultText: false,
  setSidePanelTab: (sidePanelTab) => set({ sidePanelTab }),
  setWrapResultText: (wrapResultText) => set({ wrapResultText }),
}));
