import { Command, CornerDownLeft, Play } from 'lucide-react';

import { useEditorStore } from '../../../stores/useEditorStore.js';
import { splitStatements, useQueryStore } from '../../../stores/useQueryStore.js';

/** Runs whatever is currently in the editor. */
export function RunQueryButton() {
  const isRunning = useQueryStore((state) => state.isRunning);
  const execute = useQueryStore((state) => state.execute);
  const sql = useEditorStore((state) => state.sql);

  // Nothing to run when the editor is empty or holds only separators.
  const hasStatements = splitStatements(sql).length > 0;

  return (
    <button
      type="button"
      onClick={() => void execute(sql)}
      disabled={isRunning || !hasStatements}
      className="flex h-[34px] cursor-pointer items-center gap-2 rounded bg-neutral-900 pr-[5px] pl-3 font-medium text-white hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-40"
    >
      <Play size={11} fill="currentColor" />
      {isRunning ? 'Running…' : 'Run'}
      <kbd className="flex h-6 items-center gap-0.5 rounded bg-white/15 px-1.5 text-white/70">
        <Command size={11} />
        <CornerDownLeft size={11} />
      </kbd>
    </button>
  );
}
