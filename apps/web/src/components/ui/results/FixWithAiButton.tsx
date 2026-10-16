import { ArrowRight } from 'lucide-react';

import { useAssistantStore } from '../../../stores/useAssistantStore.js';
import { useEditorStore } from '../../../stores/useEditorStore.js';
import { AiSparkleIcon } from '../common/AiSparkleIcon.js';

type FixWithAiButtonProps = {
  error: string;
};

/**
 * Hands the failing statement and its error to the assistant. The chat UI that
 * consumes `pendingFix` is still pending a spec.
 */
export function FixWithAiButton({ error }: FixWithAiButtonProps) {
  const sql = useEditorStore((state) => state.sql);
  const requestFix = useAssistantStore((state) => state.requestFix);

  return (
    <button
      type="button"
      onClick={() => requestFix(sql, error)}
      className="flex h-7 shrink-0 cursor-pointer items-center gap-1.5 rounded border border-neutral-300 bg-white px-2.5 font-medium text-neutral-700 hover:bg-neutral-50"
    >
      <AiSparkleIcon size={13} />
      Fix with AI
      <ArrowRight size={13} />
    </button>
  );
}
