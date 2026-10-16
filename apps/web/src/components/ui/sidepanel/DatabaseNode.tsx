import { Database as DatabaseIcon } from 'lucide-react';

import { useSchemaStore } from '../../../stores/useSchemaStore.js';
import type { Database } from '../../../types/index.js';
import { TableNode } from './TableNode.js';
import { TreeRow } from './TreeRow.js';

type DatabaseNodeProps = {
  database: Database;
};

export function DatabaseNode({ database }: DatabaseNodeProps) {
  const isExpanded = useSchemaStore((state) => state.expandedDatabases.includes(database.name));
  const toggleDatabase = useSchemaStore((state) => state.toggleDatabase);

  return (
    <li role="treeitem" aria-expanded={isExpanded}>
      <TreeRow
        depth={0}
        icon={<DatabaseIcon size={13} />}
        label={database.name}
        hint={`${database.tables.length}`}
        isExpandable
        isExpanded={isExpanded}
        onClick={() => toggleDatabase(database.name)}
      />

      {isExpanded && (
        <ul role="group">
          {database.tables.map((table) => (
            <TableNode key={table} database={database.name} table={table} />
          ))}
        </ul>
      )}
    </li>
  );
}
