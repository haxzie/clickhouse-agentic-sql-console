import { ArrowRight } from 'lucide-react';

import { useAssistantStore } from '../../../stores/useAssistantStore.js';
import { AiSparkleIcon } from '../common/AiSparkleIcon.js';

type FixWithAiButtonProps = {
  /** The statement that failed, which may be one of several in the editor. */
  sql: string;
  error: string;
};

/** Hands the failing statement and its error to the assistant, which sends straight away. */
export function FixWithAiButton({ sql, error }: FixWithAiButtonProps) {
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
