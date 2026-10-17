import { AlignLeft } from 'lucide-react';

import { formatSql } from '../../../lib/formatSql.js';
import { useEditorStore } from '../../../stores/useEditorStore.js';
import { IconButton } from '../common/IconButton.js';

/**
 * Re-indents the editor's SQL.
 *
 * SQL that cannot be parsed is left alone: half-typed queries are the normal
 * state of an editor, and mangling one would be worse than doing nothing.
 */
export function FormatQueryButton() {
  const sql = useEditorStore((state) => state.sql);
  const setSql = useEditorStore((state) => state.setSql);

  const onFormat = () => {
    const formatted = formatSql(sql);

    if (formatted !== null) {
      setSql(formatted);
    }
  };

  return (
    <IconButton label="Format query" onClick={onFormat} disabled={sql.trim() === ''}>
      <AlignLeft size={15} />
    </IconButton>
  );
}
