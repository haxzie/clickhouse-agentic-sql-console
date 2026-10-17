import type { UIMessage } from 'ai';

/** What a tool call that never finished reports back to the model. */
const STOPPED = 'Stopped by the user before it finished.';

type PartLike = { type: string; state?: string; text?: string; errorText?: string };

/**
 * Makes a history containing a stopped turn usable again.
 *
 * Stopping mid-stream leaves the assistant's last message half-written: a tool
 * call with no result, and sometimes nothing but a step marker. The model
 * contract has no room for either — `convertToModelMessages` refuses a call
 * without a result — so the next message would fail before it reached the
 * model. Closing the loose ends keeps the conversation going, and says plainly
 * what happened rather than pretending the call succeeded.
 */
export function closeStoppedToolCalls(messages: UIMessage[]): UIMessage[] {
  const closed = messages.map((message) => ({
    ...message,
    parts: message.parts.map((part) => closePart(part as PartLike)),
  })) as UIMessage[];

  return closed.filter((message) => message.role !== 'assistant' || carriesContent(message));
}

function closePart(part: PartLike): PartLike {
  const isToolCall = part.type.startsWith('tool-') || part.type === 'dynamic-tool';
  const settled = part.state === 'output-available' || part.state === 'output-error';

  if (!isToolCall || settled) {
    return part;
  }

  return { ...part, state: 'output-error', errorText: STOPPED };
}

/**
 * Whether an assistant message says anything. A turn stopped before the first
 * token leaves one that holds only a step marker, which the model rejects as
 * an empty assistant turn.
 */
function carriesContent(message: UIMessage): boolean {
  return message.parts.some((part) => {
    const { type, text } = part as PartLike;

    if (type === 'text' || type === 'reasoning') {
      return (text ?? '').trim() !== '';
    }

    return type.startsWith('tool-') || type === 'dynamic-tool';
  });
}
