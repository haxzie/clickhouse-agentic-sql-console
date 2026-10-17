import { useRunShortcut } from '../../lib/useRunShortcut.js';
import { AddConnectionModal } from '../ui/connections/AddConnectionModal.js';
import { ChatPanel } from '../ui/chat/ChatPanel.js';
import { SidePanel } from '../ui/sidepanel/SidePanel.js';
import { WorkspacePanel } from './WorkspacePanel.js';

/** Three-panel shell: explorer | editor + results | AI chat. */
export function AppLayout() {
  useRunShortcut();

  return (
    <div className="flex h-screen flex-col bg-white text-neutral-900">
      {/* Keeps a document heading for assistive tech now that the top bar is gone. */}
      <h1 className="sr-only">ClickHouse SQL Console</h1>

      <div className="flex min-h-0 flex-1">
        <SidePanel />
        <WorkspacePanel />
        <ChatPanel />
      </div>

      <AddConnectionModal />
    </div>
  );
}
