import { sql } from '@codemirror/lang-sql';
import { Prec, type EditorState as EditorStateType } from '@codemirror/state';
import { keymap, type EditorView } from '@codemirror/view';
import CodeMirror from '@uiw/react-codemirror';
import { useCallback, useEffect, useRef } from 'react';

import { runEditor } from '../../../lib/runEditor.js';
import { useEditorStore } from '../../../stores/useEditorStore.js';

/**
 * Cmd/Ctrl+Enter runs, inside the editor's own keymap.
 *
 * CodeMirror binds Mod-Enter to inserting a blank line and handles keys on its
 * content element, so this has to replace that binding rather than sit above
 * it: `Prec.highest` puts it ahead of the default keymap, and returning `true`
 * marks the key handled so the newline never happens.
 */
const runShortcut = Prec.highest(
  keymap.of([
    {
      key: 'Mod-Enter',
      preventDefault: true,
      run: () => {
        runEditor();

        return true;
      },
    },
  ]),
);

const extensions = [sql(), runShortcut];

export function SqlEditor() {
  const value = useEditorStore((state) => state.sql);
  const setSql = useEditorStore((state) => state.setSql);
  const selectionStart = useEditorStore((state) => state.selectionStart);
  const selectionEnd = useEditorStore((state) => state.selectionEnd);
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

  return (
    <div data-sql-editor className="h-full">
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
