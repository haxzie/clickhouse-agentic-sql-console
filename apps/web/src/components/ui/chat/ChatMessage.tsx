import type { UIMessage } from 'ai';
import { Streamdown } from 'streamdown';

import { splitSelectionContext } from '../../../lib/selectionContext.js';
import { ChatToolCall } from './ChatToolCall.js';
import { chatMarkdownComponents } from './chatMarkdownComponents.js';
import { SelectionPill } from './SelectionPill.js';
import { messageToolParts, searchProgressByToolCall } from './useChatSession.js';

type ChatMessageProps = {
  message: UIMessage;
  onApprove: (toolCallId: string) => void | Promise<void>;
  onReject: (toolCallId: string) => void;
};

/** Concatenates the text parts of a message; other part types come with tools. */
function messageText(message: UIMessage): string {
  return message.parts
    .filter((part) => part.type === 'text')
    .map((part) => part.text)
    .join('');
}

export function ChatMessage({ message, onApprove, onReject }: ChatMessageProps) {
  const text = messageText(message);

  if (message.role === 'user') {
    // A message sent with an editor selection carries it as a context block;
    // show that as the same pill the composer displayed, not as raw text.
    const { context, text: typed } = splitSelectionContext(text);

    return (
      <li className="flex justify-end">
        <div className="flex max-w-[85%] flex-col items-end gap-1.5">
          {context && <SelectionPill tone="message" selection={context} />}

          <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2 whitespace-pre-wrap">
            {typed}
          </div>
        </div>
      </li>
    );
  }

  const toolParts = messageToolParts(message);
  const searchProgress = searchProgressByToolCall(message);

  // Assistant replies are plain prose across the full width, no bubble.
  return (
    <li className="w-full">
      {toolParts.length > 0 && (
        <div className="mb-2 flex flex-col gap-2">
          {toolParts.map((part) => (
            <ChatToolCall
              key={part.toolCallId}
              part={part}
              steps={searchProgress[part.toolCallId]}
              onApprove={onApprove}
              onReject={onReject}
            />
          ))}
        </div>
      )}

      {text !== '' && (
        <div className="chat-markdown">
          <Streamdown components={chatMarkdownComponents}>{text}</Streamdown>
        </div>
      )}
    </li>
  );
}
