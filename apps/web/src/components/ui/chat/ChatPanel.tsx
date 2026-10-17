import { AiSparkleIcon } from '../common/AiSparkleIcon.js';
import { PanelHeader } from '../common/PanelHeader.js';
import { PanelHeading } from '../common/PanelHeading.js';
import { ChatComposer } from './ChatComposer.js';
import { ChatMessageList } from './ChatMessageList.js';
import { NewChatButton } from './NewChatButton.js';
import { useChatSession } from './useChatSession.js';

export function ChatPanel() {
  const chat = useChatSession();

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
