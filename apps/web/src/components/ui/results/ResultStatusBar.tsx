import { useQueryStore } from '../../../stores/useQueryStore.js';
import { PanelHeader } from '../common/PanelHeader.js';
import { PanelHeading } from '../common/PanelHeading.js';
import { RunQueryButton } from '../common/RunQueryButton.js';
import { QueryStatusIndicator } from './QueryStatusIndicator.js';
import { ResultTabs } from './ResultTabs.js';

export function ResultStatusBar() {
  const resultCount = useQueryStore((state) => state.results.length);
  const isRunning = useQueryStore((state) => state.isRunning);

  return (
    <PanelHeader>
      {/* Tabs belong to the run below them, so they fade with it; the status
          and Run button stay live. */}
      <div
        className={`flex min-w-0 flex-1 items-center transition-opacity ${
          isRunning ? 'pointer-events-none opacity-40' : ''
        }`}
      >
        {resultCount > 1 ? <ResultTabs /> : <PanelHeading>Results</PanelHeading>}
      </div>

      <div className="flex items-center gap-3">
        <QueryStatusIndicator />
        <RunQueryButton />
      </div>
    </PanelHeader>
  );
}
