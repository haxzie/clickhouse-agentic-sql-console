import type { ToolUIPart } from 'ai';
import { Check, Loader2, Search, SquarePen, TriangleAlert, X } from 'lucide-react';

import { useAssistantStore } from '../../../stores/useAssistantStore.js';
import { ChatEditDiff } from './ChatEditDiff.js';
import { toolNameOf } from './useChatSession.js';

const LABELS: Record<string, string> = {
  search: 'Searching the schema',
  get_editor_state: 'Reading the editor',
  get_last_error: 'Reading the last error',
  str_replace: 'Editing the query',
  replace_selection: 'Replacing the selection',
  insert_at_cursor: 'Inserting at the cursor',
  set_query: 'Rewriting the query',
};

type ChatToolCallProps = {
  part: ToolUIPart;
  onApprove: (toolCallId: string) => void | Promise<void>;
  onReject: (toolCallId: string) => void;
};

/**
 * One line per tool call, with the diff for an edit and — while it is waiting
 * on approval — the controls to apply or decline it.
 */
export function ChatToolCall({ part, onApprove, onReject }: ChatToolCallProps) {
  const pending = useAssistantStore((state) => state.pendingEdits[part.toolCallId]);
  const applied = useAssistantStore((state) => state.appliedEdits[part.toolCallId]);

  const name = toolNameOf(part);
  const label = LABELS[name] ?? name;
  const preview = pending?.preview ?? applied;
  const isRunning = !pending && part.state !== 'output-available' && part.state !== 'output-error';
  const failed = part.state === 'output-error' || isRejected(part);

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-sub flex items-center gap-1.5 text-neutral-500">
        <span className="shrink-0">
          {pending ? (
            <SquarePen size={12} className="text-neutral-500" />
          ) : isRunning ? (
            <Loader2 size={12} className="animate-spin" />
          ) : failed ? (
            <TriangleAlert size={12} className="text-amber-500" />
          ) : name === 'search' ? (
            <Search size={12} />
          ) : name === 'get_editor_state' ? (
            <Check size={12} />
          ) : (
            <SquarePen size={12} />
          )}
        </span>
        {pending ? `${label} — review the change` : label}
      </p>

      {preview && <ChatEditDiff preview={preview} />}

      {pending && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void onApprove(part.toolCallId)}
            className="text-sub flex h-7 cursor-pointer items-center gap-1 rounded bg-neutral-900 px-2.5 font-medium text-white hover:bg-neutral-700"
          >
            <Check size={12} />
            Approve
          </button>
          <button
            type="button"
            onClick={() => onReject(part.toolCallId)}
            className="text-sub flex h-7 cursor-pointer items-center gap-1 rounded border border-neutral-300 px-2.5 font-medium text-neutral-700 hover:bg-neutral-50"
          >
            <X size={12} />
            Reject
          </button>
        </div>
      )}
    </div>
  );
}

/** A rejected edit reports `ok: false` as a normal result, not a transport error. */
function isRejected(part: ToolUIPart): boolean {
  return (
    part.state === 'output-available' &&
    typeof part.output === 'object' &&
    part.output !== null &&
    'ok' in part.output &&
    part.output.ok === false
  );
}
