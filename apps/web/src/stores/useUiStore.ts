import { create } from 'zustand';

import type { SidePanelTab } from '../types/index.js';

/** Chrome state that no other store owns: explorer tabs, panel sizing. */
type UiState = {
  sidePanelTab: SidePanelTab;
  /** When false, long cell values are ellipsised on a single line. */
  wrapResultText: boolean;
  /**
   * Height of the results panel in pixels, or null while it still shares the
   * column evenly with the editor. Set the first time the boundary is dragged.
   */
  resultsHeight: number | null;
  /** Width of the assistant panel in pixels, or null while it keeps its default. */
  chatWidth: number | null;
  setSidePanelTab: (tab: SidePanelTab) => void;
  setWrapResultText: (wrapResultText: boolean) => void;
  setResultsHeight: (resultsHeight: number) => void;
  setChatWidth: (chatWidth: number) => void;
};

export const useUiStore = create<UiState>((set) => ({
  sidePanelTab: 'tables',
  wrapResultText: false,
  resultsHeight: null,
  chatWidth: null,
  setSidePanelTab: (sidePanelTab) => set({ sidePanelTab }),
  setWrapResultText: (wrapResultText) => set({ wrapResultText }),
  setResultsHeight: (resultsHeight) => set({ resultsHeight }),
  setChatWidth: (chatWidth) => set({ chatWidth }),
}));
