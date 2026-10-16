import { useUiStore } from '../../../stores/useUiStore.js';
import type { SidePanelTab } from '../../../types/index.js';

const TABS: { id: SidePanelTab; label: string }[] = [
  { id: 'tables', label: 'Tables' },
  { id: 'queries', label: 'Queries' },
];

export function SidePanelTabs() {
  const activeTab = useUiStore((state) => state.sidePanelTab);
  const setSidePanelTab = useUiStore((state) => state.setSidePanelTab);

  return (
    <nav
      role="tablist"
      aria-label="Explorer sections"
      className="flex shrink-0 border-b border-neutral-200"
    >
      {TABS.map((tab) => (
        <button
          key={tab.id}
          id={`tab-${tab.id}`}
          type="button"
          role="tab"
          aria-selected={activeTab === tab.id}
          onClick={() => setSidePanelTab(tab.id)}
          className={`text-sub flex-1 cursor-pointer px-3 py-2 font-medium ${
            activeTab === tab.id
              ? 'border-b-2 border-neutral-900 text-neutral-900'
              : 'text-neutral-500 hover:text-neutral-900'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
