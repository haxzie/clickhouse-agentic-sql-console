import type { ToolUIPart } from 'ai';
import {
  Check,
  ChevronDown,
  Loader2,
  Play,
  Search,
  SquarePen,
  TriangleAlert,
  X,
} from 'lucide-react';
import { useState } from 'react';

import { useAssistantStore } from '../../../stores/useAssistantStore.js';
import { ChatEditDiff } from './ChatEditDiff.js';
import { SearchProgress, type SearchStep } from './SearchProgress.js';
import { toolNameOf } from './useChatSession.js';

/** Fallbacks for when the assistant did not narrate the call itself. */
const LABELS: Record<string, string> = {
  search: 'Searching the schema',
  get_editor_state: 'Reading the editor',
  get_last_error: 'Reading the last error',
  run_query: 'Running the query',
  str_replace: 'Editing the query',
  replace_selection: 'Replacing the selection',
  insert_at_cursor: 'Inserting at the cursor',
  set_query: 'Rewriting the query',
};

type ChatToolCallProps = {
  part: ToolUIPart;
  /** Streamed sub-agent steps, when this call is a schema search. */
  steps?: SearchStep[];
  onApprove: (toolCallId: string) => void | Promise<void>;
  onReject: (toolCallId: string) => void;
};

/**
 * One line per tool call, with the diff for an edit and — while it is waiting
 * on approval — the controls to apply or decline it.
 */
export function ChatToolCall({ part, steps, onApprove, onReject }: ChatToolCallProps) {
  const pending = useAssistantStore((state) => state.pendingEdits[part.toolCallId]);
  const applied = useAssistantStore((state) => state.appliedEdits[part.toolCallId]);

  const name = toolNameOf(part);
  const actionLabel = actionInfoOf(part) ?? LABELS[name] ?? name;
  const preview = pending?.preview ?? applied;
  const isRunning = !pending && part.state !== 'output-available' && part.state !== 'output-error';
  const failed = part.state === 'output-error' || isRejected(part);

  // Detail is worth watching while a call runs — the search's commands, the
  // query being written — and folds away behind a chevron once it is done, so
  // a finished call stays one line.
  const [isOpen, setIsOpen] = useState(false);
  const detail = detailFor(name, part, steps);
  const showDetail = detail !== null && (isRunning || isOpen);

  const label = (
    <>
      <span className="shrink-0">
        {pending ? (
          <SquarePen size={12} className="text-neutral-500" />
        ) : isRunning ? (
          <Loader2 size={12} className="animate-spin" />
        ) : failed ? (
          <TriangleAlert size={12} className="text-amber-500" />
        ) : (
          iconFor(name)
        )}
      </span>
      {pending ? `${actionLabel} — review the change` : actionLabel}
    </>
  );

  return (
    <div className="flex flex-col gap-1.5">
      {detail !== null && !isRunning ? (
        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          aria-expanded={isOpen}
          className="text-sub flex w-full cursor-pointer items-center gap-1.5 text-left text-neutral-500 hover:text-neutral-900"
        >
          {label}
          <ChevronDown
            size={12}
            className={`ml-auto shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>
      ) : (
        <p className="text-sub flex items-center gap-1.5 text-neutral-500">{label}</p>
      )}

      {showDetail && detail}

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

/**
 * What a call shows beneath its label: the sub-agent's commands for a search,
 * the statement for a run. Null when there is nothing worth unfolding.
 */
function detailFor(name: string, part: ToolUIPart, steps?: SearchStep[]) {
  if (name === 'search') {
    return steps && steps.length > 0 ? <SearchProgress steps={steps} /> : null;
  }

  if (name === 'run_query') {
    // Partial while the model is still writing it, which is the point.
    const sql = (part.input as { statement?: unknown } | undefined)?.statement;

    return typeof sql === 'string' && sql.trim() !== '' ? <QuerySql sql={sql} /> : null;
  }

  return null;
}

/**
 * The statement a run is about, in the same indented rail the search steps
 * use. It wraps rather than truncates: a query is worth reading in full, and
 * it is still being typed out while the model writes it.
 */
function QuerySql({ sql }: { sql: string }) {
  return (
    <pre className="text-sub ml-[18px] border-l border-neutral-200 pr-2 pl-2.5 font-mono whitespace-pre-wrap text-neutral-400">
      {sql}
    </pre>
  );
}

/** One icon per tool, so a glance at the transcript says what kind of step it was. */
function iconFor(name: string) {
  switch (name) {
    case 'search':
      return <Search size={12} />;
    case 'run_query':
      return <Play size={12} />;
    case 'get_editor_state':
    case 'get_last_error':
      return <Check size={12} />;
    default:
      return <SquarePen size={12} />;
  }
}

/** Each tool takes an `action_info`: the assistant's own note on what it is doing. */
function actionInfoOf(part: ToolUIPart): string | null {
  const input = part.input as { action_info?: unknown } | undefined;

  return typeof input?.action_info === 'string' && input.action_info.trim() !== ''
    ? input.action_info
    : null;
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
