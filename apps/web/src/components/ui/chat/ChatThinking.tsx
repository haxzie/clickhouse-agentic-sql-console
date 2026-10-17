import { AiSparkleIcon } from '../common/AiSparkleIcon.js';

/** Shown between sending a message and the first token coming back. */
export function ChatThinking() {
  return (
    <p role="status" className="mt-3 flex items-center gap-2 text-neutral-400">
      <AiSparkleIcon size={14} className="animate-assistant-breathe" />
      Thinking…
    </p>
  );
}
