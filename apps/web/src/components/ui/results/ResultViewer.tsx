import { useQueryStore } from '../../../stores/useQueryStore.js';
import { EmptyState } from '../common/EmptyState.js';
import { FixWithAiButton } from './FixWithAiButton.js';
import { ResultStatusBar } from './ResultStatusBar.js';
import { ResultTable } from './ResultTable.js';

export function ResultViewer() {
  const rows = useQueryStore((state) => state.rows);
  const error = useQueryStore((state) => state.error);
  const durationMs = useQueryStore((state) => state.durationMs);

  // A recorded duration means a query completed, which separates an empty
  // result set from the untouched initial state.
  const hasCompletedRun = durationMs !== null;

  return (
    <section aria-label="Query results" className="flex min-h-0 flex-1 flex-col">
      <ResultStatusBar />

      <div className="flex min-h-0 flex-1 flex-col">
        {error ? (
          <div className="flex items-start justify-between gap-3 px-3 py-3">
            <pre role="alert" className="min-w-0 flex-1 font-mono whitespace-pre-wrap text-red-600">
              {error}
            </pre>
            <FixWithAiButton error={error} />
          </div>
        ) : rows.length > 0 ? (
          <ResultTable rows={rows} />
        ) : hasCompletedRun ? (
          <EmptyState message="Query executed. 0 rows returned." />
        ) : (
          <EmptyState message="Run a query to see results." />
        )}
      </div>
    </section>
  );
}
