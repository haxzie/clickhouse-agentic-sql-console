import { PanelHeader } from '../common/PanelHeader.js';
import { PanelHeading } from '../common/PanelHeading.js';
import { ClearEditorButton } from './ClearEditorButton.js';
import { FormatQueryButton } from './FormatQueryButton.js';
import { OpenSqlFileButton } from './OpenSqlFileButton.js';

export function EditorToolbar() {
  return (
    <PanelHeader>
      <PanelHeading>Query editor</PanelHeading>

      <div className="flex items-center gap-1">
        <OpenSqlFileButton />
        <FormatQueryButton />
        <ClearEditorButton />
      </div>
    </PanelHeader>
  );
}
