import { Eraser } from 'lucide-react';

import { useEditorStore } from '../../../stores/useEditorStore.js';
import { IconButton } from '../common/IconButton.js';

export function ClearEditorButton() {
  const sql = useEditorStore((state) => state.sql);
  const setSql = useEditorStore((state) => state.setSql);

  return (
    <IconButton label="Clear editor" onClick={() => setSql('')} disabled={sql.trim() === ''}>
      <Eraser size={15} />
    </IconButton>
  );
}
