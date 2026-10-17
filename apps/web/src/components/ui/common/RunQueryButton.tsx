import { Command, CornerDownLeft, Play } from 'lucide-react';

import { useMemo } from 'react';

import { runTarget, type RunTarget } from '../../../lib/sql.js';
import { useEditorStore } from '../../../stores/useEditorStore.js';
import { useQueryStore } from '../../../stores/useQueryStore.js';

/** Runs whatever is currently in the editor. */
export function RunQueryButton() {
  const isRunning = useQueryStore((state) => state.isRunning);
  const execute = useQueryStore((state) => state.execute);
  const sql = useEditorStore((state) => state.sql);
  const selectionStart = useEditorStore((state) => state.selectionStart);
  const selectionEnd = useEditorStore((state) => state.selectionEnd);

  const target = useMemo(
    () => runTarget({ sql, selectionStart, selectionEnd }),
    [sql, selectionStart, selectionEnd],
  );

  const statementCount = target.statements.length;

  // Nothing to run when the editor is empty or holds only separators.
  const hasStatements = statementCount > 0;

  return (
    <button
      type="button"
      onClick={() => void execute(target.sql)}
      disabled={isRunning || !hasStatements}
      className="flex h-[34px] cursor-pointer items-center gap-2 rounded bg-neutral-900 pr-[5px] pl-3 font-medium text-white hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-40"
    >
      <Play size={11} fill="currentColor" />
      {isRunning ? 'Running…' : 'Run'}

      {/* What a Run will execute: the selection, or several statements. */}
      {(statementCount > 1 || target.fromSelection) && (
        <span
          title={badgeTitle(target)}
          className="text-sub rounded bg-white/20 px-1 font-semibold"
        >
          {target.fromSelection
            ? `selection${statementCount > 1 ? ` ${statementCount}` : ''}`
            : statementCount}
        </span>
      )}
      <kbd className="flex h-6 items-center gap-0.5 rounded bg-white/15 px-1.5 text-white/70">
        <Command size={11} />
        <CornerDownLeft size={11} />
      </kbd>
    </button>
  );
}

function badgeTitle(target: RunTarget): string {
  const count = target.statements.length;
  const what = count === 1 ? '1 statement' : `${count} statements`;

  return target.fromSelection ? `Runs the selected text (${what})` : `${what} will run in order`;
}
