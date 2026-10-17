import type { UIMessage } from 'ai';
import { Streamdown } from 'streamdown';

import { ChatToolCall } from './ChatToolCall.js';
import { chatMarkdownComponents } from './chatMarkdownComponents.js';
import { messageToolParts } from './useChatSession.js';

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
    return (
      <li className="flex justify-end">
        <div className="max-w-[85%] rounded-lg border border-neutral-200 bg-white px-3 py-2 whitespace-pre-wrap">
          {text}
        </div>
      </li>
    );
  }

  const toolParts = messageToolParts(message);

  // Assistant replies are plain prose across the full width, no bubble.
  return (
    <li className="w-full">
      {toolParts.length > 0 && (
        <div className="mb-2 flex flex-col gap-2">
          {toolParts.map((part) => (
            <ChatToolCall
              key={part.toolCallId}
              part={part}
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
