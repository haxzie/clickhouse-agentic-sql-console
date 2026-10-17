import { diffLines } from 'diff';
import { useMemo } from 'react';

import type { EditPreview } from '../../../lib/editorTools.js';

type ChatEditDiffProps = {
  preview: EditPreview;
};

type Row = { text: string; kind: 'added' | 'removed' | 'context' };

/** Unchanged lines kept around each change, so edits read in context. */
const CONTEXT_LINES = 2;

/**
 * Line diff of a pending or applied edit. jsdiff computes it; the rows are
 * rendered here so the styling matches the rest of the panel.
 */
export function ChatEditDiff({ preview }: ChatEditDiffProps) {
  const rows = useMemo(() => toRows(preview), [preview]);

  return (
    <div className="text-sub overflow-x-auto rounded-md border border-neutral-200 bg-white py-1 font-mono">
      {rows.map((row, index) => (
        <div
          key={index}
          className={
            row.kind === 'added'
              ? 'bg-emerald-50 px-2 text-emerald-800'
              : row.kind === 'removed'
                ? 'bg-red-50 px-2 text-red-800'
                : 'px-2 text-neutral-400'
          }
        >
          <span className="mr-1.5 inline-block w-2 select-none">
            {row.kind === 'added' ? '+' : row.kind === 'removed' ? '-' : ''}
          </span>
          {row.text === '' ? ' ' : row.text}
        </div>
      ))}
    </div>
  );
}

function toRows({ before, after }: EditPreview): Row[] {
  const rows: Row[] = [];

  for (const change of diffLines(before, after)) {
    const lines = change.value.replace(/\n$/, '').split('\n');

    if (change.added || change.removed) {
      const kind = change.added ? 'added' : 'removed';
      rows.push(...lines.map((text) => ({ text, kind }) as Row));
      continue;
    }

    // Collapse long runs of unchanged lines to the edges nearest the change.
    if (lines.length <= CONTEXT_LINES * 2 + 1) {
      rows.push(...lines.map((text) => ({ text, kind: 'context' }) as Row));
      continue;
    }

    const head = lines.slice(0, CONTEXT_LINES).map((text) => ({ text, kind: 'context' }) as Row);
    const tail = lines.slice(-CONTEXT_LINES).map((text) => ({ text, kind: 'context' }) as Row);

    rows.push(...(rows.length === 0 ? [] : head), { text: '⋯', kind: 'context' }, ...tail);
  }

  return rows;
}
