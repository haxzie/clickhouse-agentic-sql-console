import { useEditorStore } from '../stores/useEditorStore.js';
import { useQueryStore } from '../stores/useQueryStore.js';
import { runTarget } from './sql.js';

/**
 * Runs what the Run button would run: the selection when there is one, the
 * whole buffer otherwise.
 *
 * Reads the stores directly so it can be called from outside React — a
 * CodeMirror keybinding, a window listener — and stays one definition of what
 * "run" means. A press while a query is in flight is ignored, which is what
 * the button's disabled state does.
 */
export function runEditor(): void {
  const { isRunning, execute } = useQueryStore.getState();

  if (isRunning) {
    return;
  }

  const target = runTarget(useEditorStore.getState());

  if (target.statements.length > 0) {
    void execute(target.sql);
  }
}
