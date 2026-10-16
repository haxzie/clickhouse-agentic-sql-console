import { sql } from '@codemirror/lang-sql';
import CodeMirror from '@uiw/react-codemirror';
import { useCallback } from 'react';

import { useEditorStore } from '../../../stores/useEditorStore.js';
import { splitStatements, useQueryStore } from '../../../stores/useQueryStore.js';

const extensions = [sql()];

export function SqlEditor() {
  const value = useEditorStore((state) => state.sql);
  const setSql = useEditorStore((state) => state.setSql);
  const execute = useQueryStore((state) => state.execute);

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault();

        // Mirrors the Run button, which is disabled with nothing to run.
        const sql = useEditorStore.getState().sql;

        if (splitStatements(sql).length > 0) {
          void execute(sql);
        }
      }
    },
    [execute],
  );

  return (
    <div onKeyDown={onKeyDown} className="h-full">
      <CodeMirror
        value={value}
        onChange={setSql}
        extensions={extensions}
        theme="light"
        height="100%"
        basicSetup={{ highlightActiveLine: false, highlightActiveLineGutter: false }}
        className="h-full"
      />
    </div>
  );
}
