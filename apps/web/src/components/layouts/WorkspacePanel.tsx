import { EditorPanel } from '../ui/editor/EditorPanel.js';
import { ResultViewer } from '../ui/results/ResultViewer.js';

/** Middle column: the SQL editor stacked above its result viewer. */
export function WorkspacePanel() {
  return (
    <main className="flex min-w-0 flex-1 flex-col">
      <EditorPanel />
      <ResultViewer />
    </main>
  );
}
