import { useEditorStore } from '../../../stores/useEditorStore.js';
import type { QueryHistoryEntry } from '../../../types/index.js';

const STATUS_STYLES: Record<QueryHistoryEntry['status'], string> = {
  running: 'bg-amber-400',
  success: 'bg-emerald-500',
  error: 'bg-red-500',
};

type QueryListItemProps = {
  entry: QueryHistoryEntry;
};

export function QueryListItem({ entry }: QueryListItemProps) {
  const setSql = useEditorStore((state) => state.setSql);

  const meta =
    entry.status === 'error'
      ? 'failed'
      : entry.status === 'running'
        ? 'running…'
        : `${entry.rowCount ?? 0} rows · ${entry.durationMs ?? 0} ms`;

  return (
    <li>
      <button
        type="button"
        onClick={() => setSql(entry.sql)}
        title={entry.error ?? entry.sql}
        className="w-full cursor-pointer border-b border-neutral-200/70 px-3 py-2 text-left hover:bg-neutral-200/60"
      >
        <span className="flex items-center gap-1.5">
          <span className={`size-1.5 shrink-0 rounded-full ${STATUS_STYLES[entry.status]}`} />
          <span className="truncate font-mono text-neutral-700">{entry.sql}</span>
        </span>
        <span className="text-sub mt-0.5 block pl-3 text-neutral-400">
          <time dateTime={new Date(entry.executedAt).toISOString()}>
            {new Date(entry.executedAt).toLocaleTimeString()}
          </time>
          {` · ${meta}`}
        </span>
      </button>
    </li>
  );
}
