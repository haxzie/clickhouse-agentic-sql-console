import { ChevronsUpDown } from 'lucide-react';

import { useConnectionStore } from '../../../stores/useConnectionStore.js';
import { ClickHouseLogo } from '../common/ClickHouseLogo.js';

export function DataSourceButton() {
  const connections = useConnectionStore((state) => state.connections);
  const activeId = useConnectionStore((state) => state.activeId);
  const isPickerOpen = useConnectionStore((state) => state.isPickerOpen);
  const togglePicker = useConnectionStore((state) => state.togglePicker);

  const active = connections.find((connection) => connection.id === activeId);

  return (
    <button
      type="button"
      onClick={togglePicker}
      aria-haspopup="listbox"
      aria-expanded={isPickerOpen}
      className="flex h-full w-full cursor-pointer items-center gap-2 px-3 text-left hover:bg-neutral-50"
    >
      <ClickHouseLogo className="h-4 w-[18px] shrink-0" />

      {/* min-w-0 lets the name ellipsise while the dot stays pinned beside it. */}
      <span className="flex min-w-0 items-center gap-1.5">
        <span className="truncate font-medium text-neutral-900">
          {active?.name ?? 'No connection'}
        </span>
        {active && (
          <span
            aria-label="Active"
            title="Active"
            className="size-1.5 shrink-0 rounded-full bg-emerald-500"
          />
        )}
      </span>

      <ChevronsUpDown size={13} className="ml-auto shrink-0 text-neutral-400" />
    </button>
  );
}
