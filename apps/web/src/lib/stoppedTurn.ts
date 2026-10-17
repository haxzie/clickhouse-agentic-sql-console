import type { UIMessage } from 'ai';

/** What a tool call that never finished shows, and reports to the model. */
export const STOPPED = 'Stopped by the user before it finished.';

type PartLike = { type: string; state?: string };

/**
 * Settles the tool calls a stopped turn left open.
 *
 * Nothing finishes them otherwise: the request is gone, so the parts keep
 * their running state and the UI spins on a call that will never report back.
 * Marking them failed also makes the history sendable — the model contract has
 * no room for a call without a result.
 */
export function closeStoppedToolCalls(message: UIMessage): UIMessage {
  return {
    ...message,
    parts: message.parts.map((part) => {
      const { type, state } = part as PartLike;
      const isToolCall = type.startsWith('tool-') || type === 'dynamic-tool';

      if (!isToolCall || state === 'output-available' || state === 'output-error') {
        return part;
      }

      return { ...part, state: 'output-error', errorText: STOPPED } as typeof part;
    }),
  };
}
