import { useEffect } from 'react';

import { useConnectionStore } from '../../../stores/useConnectionStore.js';
import { useSchemaStore } from '../../../stores/useSchemaStore.js';
import { PanelHeader } from '../common/PanelHeader.js';
import { ConnectionDropdown } from './ConnectionDropdown.js';
import { DataSourceButton } from './DataSourceButton.js';

/** Sits above the explorer tabs: shows the active data source and opens the picker. */
export function DataSourceHeader() {
  const isPickerOpen = useConnectionStore((state) => state.isPickerOpen);
  const loadConnections = useConnectionStore((state) => state.loadConnections);
  const loadSchema = useSchemaStore((state) => state.loadSchema);

  useEffect(() => {
    // Connections must resolve before the first schema read targets one.
    void loadConnections().then(loadSchema);
  }, [loadConnections, loadSchema]);

  return (
    <PanelHeader flush className="relative bg-white">
      <DataSourceButton />
      {isPickerOpen && <ConnectionDropdown />}
    </PanelHeader>
  );
}
