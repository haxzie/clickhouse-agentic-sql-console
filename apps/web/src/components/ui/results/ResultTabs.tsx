import { useQueryStore } from '../../../stores/useQueryStore.js';

/** One tab per statement, shown when a run produced more than one result. */
export function ResultTabs() {
  const results = useQueryStore((state) => state.results);
  const activeResult = useQueryStore((state) => state.activeResult);
  const setActiveResult = useQueryStore((state) => state.setActiveResult);

  return (
    <nav
      role="tablist"
      aria-label="Query results"
      className="-mb-px flex h-full items-stretch gap-3"
    >
      {results.map((result, index) => (
        <button
          key={result.id}
          type="button"
          role="tab"
          aria-selected={index === activeResult}
          title={result.sql}
          onClick={() => setActiveResult(index)}
          // Full height so the underline lands on the header's own bottom edge.
          className={`text-sub flex h-full cursor-pointer items-center gap-1.5 border-b-2 font-medium ${
            index === activeResult
              ? 'border-neutral-900 text-neutral-900'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <span
            aria-hidden
            className={`size-1.5 shrink-0 rounded-full ${
              result.error ? 'bg-red-500' : 'bg-emerald-500'
            }`}
          />
          Query {index + 1}
        </button>
      ))}
    </nav>
  );
}
