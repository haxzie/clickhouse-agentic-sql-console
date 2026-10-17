import { useQueryStore } from '../../../stores/useQueryStore.js';
import { EmptyState } from '../common/EmptyState.js';
import { FixWithAiButton } from './FixWithAiButton.js';
import { ResultStatusBar } from './ResultStatusBar.js';
import { ResultTable } from './ResultTable.js';

export function ResultViewer() {
  const results = useQueryStore((state) => state.results);
  const activeResult = useQueryStore((state) => state.activeResult);

  // No results at all means nothing has been run yet; a result with no rows
  // means a statement completed and returned nothing.
  const current = results[activeResult];

  return (
    <section aria-label="Query results" className="flex min-h-0 flex-1 flex-col">
      <ResultStatusBar />

      <div className="flex min-h-0 flex-1 flex-col">
        {!current ? (
          <div className="min-h-0 flex-1 overflow-auto">
            <EmptyState message="Run a query to see results." />
          </div>
        ) : current.error ? (
          <div className="min-h-0 flex-1 overflow-auto">
            <div className="flex items-start justify-between gap-3 px-3 py-3">
              <pre
                role="alert"
                className="min-w-0 flex-1 font-mono whitespace-pre-wrap text-red-600"
              >
                {current.error}
              </pre>
              <FixWithAiButton sql={current.sql} error={current.error} />
            </div>
          </div>
        ) : current.rows.length === 0 ? (
          <div className="min-h-0 flex-1 overflow-auto">
            <EmptyState message="Query executed. 0 rows returned." />
          </div>
        ) : (
          <ResultTable key={current.id} rows={current.rows} />
        )}
      </div>
    </section>
  );
}
