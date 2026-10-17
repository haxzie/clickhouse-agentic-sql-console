import { TextSelect } from 'lucide-react';

import { selectionLabel, type SelectionContext } from '../../../lib/selectionContext.js';

type SelectionPillProps = {
  selection: SelectionContext;
  /** Shown in the composer; the transcript uses the quieter variant. */
  tone?: 'composer' | 'message';
};

/** Shows what the assistant will see from the editor alongside the message. */
export function SelectionPill({ selection, tone = 'composer' }: SelectionPillProps) {
  return (
    <span
      title={selection.text}
      className={`text-sub flex w-fit max-w-full items-center gap-1.5 rounded-full border px-2 py-0.5 ${
        tone === 'composer'
          ? 'border-neutral-200 bg-neutral-50 text-neutral-600'
          : 'border-neutral-200 bg-white text-neutral-500'
      }`}
    >
      <TextSelect size={12} className="shrink-0" />
      <span className="truncate">{selectionLabel(selection)}</span>
    </span>
  );
}
