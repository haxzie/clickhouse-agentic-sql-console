import { AiSparkleIcon } from '../common/AiSparkleIcon.js';

/** Shown before the first message: what the assistant is, and what to ask it. */
export function ChatEmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8">
      <span className="flex size-11 items-center justify-center rounded-full border border-neutral-200 bg-white shadow-sm">
        <AiSparkleIcon size={20} />
      </span>

      <span className="flex max-w-64 flex-col gap-1 text-center">
        <strong className="font-semibold text-neutral-900">Describe the query you need</strong>
        <span className="text-sub text-neutral-500">
          I search your schema for the right tables, write the SQL into the editor and explain
          errors when one comes back. You decide what to run.
        </span>
      </span>
    </div>
  );
}
