import type { UIMessage } from 'ai';
import { useEffect, useRef } from 'react';

import { ChatEmptyState } from './ChatEmptyState.js';
import { ChatMessage } from './ChatMessage.js';
import { ChatThinking } from './ChatThinking.js';

type ChatMessageListProps = {
  messages: UIMessage[];
  status: string;
  error: Error | undefined;
  onApprove: (toolCallId: string) => void | Promise<void>;
  onReject: (toolCallId: string) => void;
};

export function ChatMessageList({
  messages,
  status,
  error,
  onApprove,
  onReject,
}: ChatMessageListProps) {
  const endRef = useRef<HTMLDivElement>(null);

  // Follow the stream as it grows.
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages, status]);

  if (messages.length === 0 && !error) {
    return <ChatEmptyState />;
  }

  return (
    <div data-scroll-pane className="min-h-0 flex-1 overflow-auto overscroll-contain px-3 py-3">
      <ol className="flex flex-col gap-4">
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            onApprove={onApprove}
            onReject={onReject}
          />
        ))}
      </ol>

      {isWaiting(messages, status) && <ChatThinking />}

      {error && (
        <p role="alert" className="mt-3 text-red-600">
          {error.message}
        </p>
      )}

      <div ref={endRef} />
    </div>
  );
}

/**
 * True while the assistant owes a reply and has not shown anything yet.
 *
 * `submitted` alone is too narrow: the status flips to `streaming` as soon as
 * the response opens, which happens well before the first token when the model
 * is running tools. Without this the indicator would blink out and leave the
 * panel looking idle mid-turn.
 */
function isWaiting(messages: UIMessage[], status: string): boolean {
  if (status !== 'submitted' && status !== 'streaming') {
    return false;
  }

  const last = messages.at(-1);

  if (!last || last.role !== 'assistant') {
    return true;
  }

  return !last.parts.some(
    (part) => (part.type === 'text' && part.text.trim() !== '') || part.type.startsWith('tool-'),
  );
}
