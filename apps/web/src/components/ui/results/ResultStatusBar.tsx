import { PanelHeader } from '../common/PanelHeader.js';
import { PanelHeading } from '../common/PanelHeading.js';
import { RunQueryButton } from '../common/RunQueryButton.js';
import { QueryStatusIndicator } from './QueryStatusIndicator.js';

export function ResultStatusBar() {
  return (
    <PanelHeader>
      <PanelHeading>Results</PanelHeading>

      <div className="flex items-center gap-3">
        <QueryStatusIndicator />
        <RunQueryButton />
      </div>
    </PanelHeader>
  );
}
