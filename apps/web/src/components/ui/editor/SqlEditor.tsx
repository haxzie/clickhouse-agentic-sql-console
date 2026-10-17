import { sql } from '@codemirror/lang-sql';
import type { EditorState as EditorStateType } from '@codemirror/state';
import type { EditorView } from '@codemirror/view';
import CodeMirror from '@uiw/react-codemirror';
import { useCallback, useEffect, useRef } from 'react';

import { useEditorStore } from '../../../stores/useEditorStore.js';
import { runTarget } from '../../../lib/sql.js';
import { useQueryStore } from '../../../stores/useQueryStore.js';

const extensions = [sql()];

export function SqlEditor() {
  const value = useEditorStore((state) => state.sql);
  const setSql = useEditorStore((state) => state.setSql);
  const selectionStart = useEditorStore((state) => state.selectionStart);
  const selectionEnd = useEditorStore((state) => state.selectionEnd);
  const execute = useQueryStore((state) => state.execute);
  const viewRef = useRef<EditorView | null>(null);

  const onUpdate = useCallback((viewUpdate: { state: EditorStateType }) => {
    const { from, to } = viewUpdate.state.selection.main;
    useEditorStore.getState().setSelection(from, to);
  }, []);

  // The assistant selects through the store when it runs one statement of
  // several; mirroring that back into CodeMirror is what makes the highlight
  // show up. Selections the user makes arrive here already matching, so the
  // equality check keeps this from fighting with `onUpdate`.
  useEffect(() => {
    const view = viewRef.current;

    if (!view) {
      return;
    }

    const { from, to } = view.state.selection.main;

    if (from === selectionStart && to === selectionEnd) {
      return;
    }

    const length = view.state.doc.length;

    view.dispatch({
      selection: { anchor: Math.min(selectionStart, length), head: Math.min(selectionEnd, length) },
    });
  }, [selectionStart, selectionEnd]);

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault();

        // Mirrors the Run button: the selection when there is one, else all.
        const target = runTarget(useEditorStore.getState());

        if (target.statements.length > 0) {
          void execute(target.sql);
        }
      }
    },
    [execute],
  );

  return (
    <div onKeyDown={onKeyDown} data-sql-editor className="h-full">
      <CodeMirror
        value={value}
        onChange={setSql}
        onUpdate={onUpdate}
        onCreateEditor={(view) => {
          viewRef.current = view;
        }}
        extensions={extensions}
        theme="light"
        height="100%"
        basicSetup={{ highlightActiveLine: false, highlightActiveLineGutter: false }}
        className="h-full"
      />
    </div>
  );
}
