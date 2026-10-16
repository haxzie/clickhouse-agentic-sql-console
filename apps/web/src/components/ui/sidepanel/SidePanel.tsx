import { useUiStore } from '../../../stores/useUiStore.js';
import { DataSourceHeader } from '../connections/DataSourceHeader.js';
import { QueryList } from './QueryList.js';
import { SidePanelTabs } from './SidePanelTabs.js';
import { TableTree } from './TableTree.js';

export function SidePanel() {
  const activeTab = useUiStore((state) => state.sidePanelTab);

  return (
    <aside
      aria-label="Explorer"
      className="flex w-80 shrink-0 flex-col border-r border-neutral-200 bg-neutral-50"
    >
      <DataSourceHeader />
      <SidePanelTabs />

      <div
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
        data-scroll-pane
        className="min-h-0 flex-1 overflow-auto overscroll-contain"
      >
        {activeTab === 'tables' ? <TableTree /> : <QueryList />}
      </div>
    </aside>
  );
}
