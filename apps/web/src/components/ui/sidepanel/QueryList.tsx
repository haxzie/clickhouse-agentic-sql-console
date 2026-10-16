import { useQueryStore } from '../../../stores/useQueryStore.js';
import { EmptyState } from '../common/EmptyState.js';
import { QueryListItem } from './QueryListItem.js';

export function QueryList() {
  const history = useQueryStore((state) => state.history);
  const clearHistory = useQueryStore((state) => state.clearHistory);

  if (history.length === 0) {
    return <EmptyState message="Executed queries will appear here." />;
  }

  return (
    <section aria-label="Query history">
      <header className="flex items-center justify-between px-3 py-2">
        <h2 className="text-sub font-medium tracking-wide text-neutral-400 uppercase">
          {history.length} executed
        </h2>
        <button
          type="button"
          onClick={clearHistory}
          className="cursor-pointer text-neutral-500 hover:text-neutral-900"
        >
          Clear
        </button>
      </header>

      <ol>
        {history.map((entry) => (
          <QueryListItem key={entry.id} entry={entry} />
        ))}
      </ol>
    </section>
  );
}
