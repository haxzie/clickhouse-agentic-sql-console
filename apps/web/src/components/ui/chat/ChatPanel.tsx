import { AiSparkleIcon } from '../common/AiSparkleIcon.js';
import { PanelHeader } from '../common/PanelHeader.js';
import { PanelHeading } from '../common/PanelHeading.js';
import { NewChatButton } from './NewChatButton.js';

/**
 * Placeholder shell for the AI assistant. The chat UI itself is still
 * pending a spec, so only the panel chrome lives here for now.
 */
export function ChatPanel() {
  return (
    <aside
      aria-label="AI assistant"
      className="flex w-96 shrink-0 flex-col border-l border-neutral-200 bg-neutral-50"
    >
      <PanelHeader>
        <PanelHeading>
          <AiSparkleIcon size={14} />
          Assistant
        </PanelHeading>

        <NewChatButton />
      </PanelHeader>

      <div className="flex flex-1 items-center justify-center px-6">
        <p className="text-center text-neutral-400">Chat UI pending.</p>
      </div>
    </aside>
  );
}
