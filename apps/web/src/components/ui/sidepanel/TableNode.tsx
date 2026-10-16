import { Columns3, Table2 } from 'lucide-react';

import { useEditorStore } from '../../../stores/useEditorStore.js';
import { tableKey, useSchemaStore } from '../../../stores/useSchemaStore.js';
import { TreeRow } from './TreeRow.js';

type TableNodeProps = {
  database: string;
  table: string;
};

export function TableNode({ database, table }: TableNodeProps) {
  const key = tableKey(database, table);
  const isExpanded = useSchemaStore((state) => state.expandedTables.includes(key));
  const isLoading = useSchemaStore((state) => state.loadingTables.includes(key));
  const columns = useSchemaStore((state) => state.columnsByTable[key]);
  const toggleTable = useSchemaStore((state) => state.toggleTable);
  const setSql = useEditorStore((state) => state.setSql);

  return (
    <li role="treeitem" aria-expanded={isExpanded}>
      <TreeRow
        depth={1}
        icon={<Table2 size={13} />}
        label={table}
        isExpandable
        isExpanded={isExpanded}
        onClick={() => void toggleTable(database, table)}
      />

      {isExpanded && isLoading && <p className="py-1 pl-12 text-neutral-400">Loading columns…</p>}

      {isExpanded && columns && (
        <ul role="group">
          {columns.map((column) => (
            <li key={column.name} role="treeitem">
              <TreeRow
                depth={2}
                icon={<Columns3 size={12} />}
                label={column.name}
                hint={column.type}
                onClick={() => setSql(`SELECT ${column.name} FROM ${database}.${table} LIMIT 100`)}
              />
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
