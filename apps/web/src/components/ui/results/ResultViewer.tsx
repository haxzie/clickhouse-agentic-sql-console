import { useRef } from 'react';

import { useQueryStore } from '../../../stores/useQueryStore.js';
import { useUiStore } from '../../../stores/useUiStore.js';
import { EmptyState } from '../common/EmptyState.js';
import { ResizeHandle } from '../common/ResizeHandle.js';
import { FixWithAiButton } from './FixWithAiButton.js';
import { ResultStatusBar } from './ResultStatusBar.js';
import { ResultTable } from './ResultTable.js';

/** Leaves room for the status bar here and the toolbar above. */
const MIN_HEIGHT = 96;
const MIN_EDITOR_HEIGHT = 120;

export function ResultViewer() {
  const results = useQueryStore((state) => state.results);
  const activeResult = useQueryStore((state) => state.activeResult);
  const isRunning = useQueryStore((state) => state.isRunning);
  const height = useUiStore((state) => state.resultsHeight);
  const setHeight = useUiStore((state) => state.setResultsHeight);
  const panel = useRef<HTMLElement>(null);

  // Clamped against the column it lives in, so a drag can neither squash the
  // panel to nothing nor push the editor off the top.
  const resize = (next: number) => {
    const column = panel.current?.parentElement?.clientHeight ?? 0;
    const max = Math.max(MIN_HEIGHT, column - MIN_EDITOR_HEIGHT);

    setHeight(Math.min(Math.max(next, MIN_HEIGHT), max));
  };

  // No results at all means nothing has been run yet; a result with no rows
  // means a statement completed and returned nothing.
  const current = results[activeResult];

  return (
    <section
      ref={panel}
      aria-label="Query results"
      style={height === null ? undefined : { height }}
      className={`relative flex min-h-0 flex-col ${height === null ? 'flex-1' : 'shrink-0'}`}
    >
      <ResizeHandle
        edge="top"
        label="Resize results panel"
        sizeAtStart={() => panel.current?.clientHeight ?? 0}
        onResize={resize}
      />

      <ResultStatusBar />

      {/* The last run stays readable while the next one is in flight, faded
          rather than replaced, and inert so a stale row cannot be clicked. */}
      <div
        aria-busy={isRunning}
        className={`flex min-h-0 flex-1 flex-col transition-opacity ${
          isRunning ? 'pointer-events-none opacity-40' : ''
        }`}
      >
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
