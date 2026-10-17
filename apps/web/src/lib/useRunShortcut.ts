import { useEffect } from 'react';

import { runEditor } from './runEditor.js';

/**
 * Cmd/Ctrl+Enter runs the editor from anywhere in the console: the badge on
 * the Run button promises the shortcut wherever you are, including a freshly
 * loaded page where nothing has focus yet.
 *
 * On the window and in the capture phase, so the chord is claimed before any
 * component sees it. The editor has its own binding for the same chord (see
 * `SqlEditor`), which covers the case where CodeMirror handles the key on its
 * content element and stops it from reaching here; whichever fires first wins,
 * and `runEditor` ignores the second because a run is already in flight.
 */
export function useRunShortcut(): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.key !== 'Enter') {
        return;
      }

      // Claimed before the editor can turn it into a newline.
      event.preventDefault();
      event.stopPropagation();

      runEditor();
    };

    window.addEventListener('keydown', onKeyDown, true);

    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, []);
}
