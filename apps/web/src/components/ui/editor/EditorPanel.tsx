import { EditorToolbar } from './EditorToolbar.js';
import { SqlEditor } from './SqlEditor.js';

export function EditorPanel() {
  return (
    <section
      aria-label="Query editor"
      className="flex min-h-0 flex-1 flex-col border-b border-neutral-200"
    >
      <EditorToolbar />
      <div data-scroll-pane className="min-h-0 flex-1 overflow-auto overscroll-contain">
        <SqlEditor />
      </div>
    </section>
  );
}
