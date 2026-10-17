import { useQueryStore } from '../../../stores/useQueryStore.js';
import { PanelHeader } from '../common/PanelHeader.js';
import { PanelHeading } from '../common/PanelHeading.js';
import { RunQueryButton } from '../common/RunQueryButton.js';
import { QueryStatusIndicator } from './QueryStatusIndicator.js';
import { ResultTabs } from './ResultTabs.js';

export function ResultStatusBar() {
  const resultCount = useQueryStore((state) => state.results.length);

  return (
    <PanelHeader>
      {resultCount > 1 ? <ResultTabs /> : <PanelHeading>Results</PanelHeading>}

      <div className="flex items-center gap-3">
        <QueryStatusIndicator />
        <RunQueryButton />
      </div>
    </PanelHeader>
  );
}
