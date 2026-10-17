import { useRef } from 'react';

import { useUiStore } from '../../../stores/useUiStore.js';
import { AiSparkleIcon } from '../common/AiSparkleIcon.js';
import { ResizeHandle } from '../common/ResizeHandle.js';
import { PanelHeader } from '../common/PanelHeader.js';
import { PanelHeading } from '../common/PanelHeading.js';
import { ChatComposer } from './ChatComposer.js';
import { ChatMessageList } from './ChatMessageList.js';
import { NewChatButton } from './NewChatButton.js';
import { useChatSession } from './useChatSession.js';

/** Narrow enough to still read a reply; wide enough to leave a console behind it. */
const MIN_WIDTH = 280;
const MIN_WORKSPACE_WIDTH = 420;

export function ChatPanel() {
  const chat = useChatSession();
  const width = useUiStore((state) => state.chatWidth);
  const setWidth = useUiStore((state) => state.setChatWidth);
  const panel = useRef<HTMLElement>(null);

  // Clamped against the workspace beside it rather than the whole window: the
  // explorer keeps its own width, so what a wider panel actually eats is the
  // editor, and that is what needs the floor.
  const resize = (next: number) => {
    const current = panel.current?.clientWidth ?? 0;
    const workspace = panel.current?.previousElementSibling?.clientWidth ?? 0;
    const max = Math.max(MIN_WIDTH, current + (workspace - MIN_WORKSPACE_WIDTH));

    setWidth(Math.min(Math.max(next, MIN_WIDTH), max));
  };

  return (
    <aside
      ref={panel}
      aria-label="AI assistant"
      style={width === null ? undefined : { width }}
      className={`relative flex shrink-0 flex-col border-l border-neutral-200 bg-neutral-50 ${
        width === null ? 'w-96' : ''
      }`}
    >
      <ResizeHandle
        edge="left"
        label="Resize assistant panel"
        sizeAtStart={() => panel.current?.clientWidth ?? 0}
        onResize={resize}
      />

      <PanelHeader>
        <PanelHeading>
          <AiSparkleIcon size={14} />
          Assistant
        </PanelHeading>

        <NewChatButton onNewChat={chat.reset} />
      </PanelHeader>

      <ChatMessageList
        messages={chat.messages}
        status={chat.status}
        error={chat.error}
        onApprove={chat.approveEdit}
        onReject={chat.rejectEdit}
      />

      <ChatComposer
        input={chat.input}
        onInputChange={chat.setInput}
        onSubmit={chat.submit}
        isBusy={chat.isBusy}
        onStop={chat.stop}
      />
    </aside>
  );
}
