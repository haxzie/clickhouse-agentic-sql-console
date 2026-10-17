import { useChat } from '@ai-sdk/react';
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithToolCalls,
  type ToolUIPart,
  type UIMessage,
} from 'ai';
import { useEffect, useState } from 'react';

import {
  isEditTool,
  previewEdit,
  rejectedByUser,
  runEditorTool,
} from '../../../lib/editorTools.js';
import {
  contextForStatement,
  describeSelection,
  withSelectionContext,
} from '../../../lib/selectionContext.js';
import { useEditorStore } from '../../../stores/useEditorStore.js';
import { useAssistantStore } from '../../../stores/useAssistantStore.js';
import type { SearchStep } from './SearchProgress.js';

/**
 * Wraps the AI SDK chat with the pieces this panel needs: the composer draft,
 * the "Fix with AI" hand-off, and execution of the editor tools.
 *
 * The editing tools have no server-side `execute`, so the SDK forwards their
 * calls here; the browser owns the buffer, applies the change and returns the
 * result. `sendAutomaticallyWhen` then continues the model's turn.
 */
export function useChatSession() {
  const [input, setInput] = useState('');

  const { messages, sendMessage, status, error, stop, setMessages, addToolResult } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    onToolCall: async ({ toolCall }) => {
      const { toolName, toolCallId, input } = toolCall;
      const assistant = useAssistantStore.getState();
      const preview = previewEdit(toolName, input);

      // In "ask" mode an edit waits for the user instead of running. The tool
      // call stays open until they decide, which keeps the model's turn paused.
      if (isEditTool(toolName) && assistant.editApproval === 'ask' && preview) {
        assistant.addPendingEdit({ toolCallId, toolName, input, preview });
        return;
      }

      const output = await runEditorTool(toolName, input);

      if (!output) {
        return;
      }

      if (preview && 'ok' in output && output.ok) {
        assistant.recordAppliedEdit(toolCallId, preview);
      }

      void addToolResult({ tool: toolName, toolCallId, output });
    },
  });

  const pendingFix = useAssistantStore((state) => state.pendingFix);
  const clearFix = useAssistantStore((state) => state.clearFix);

  const isBusy = status === 'submitted' || status === 'streaming';

  // "Fix with AI" sends straight away. If a turn is already in flight it is
  // drafted instead, since sending would interrupt the running request.
  useEffect(() => {
    if (!pendingFix) {
      return;
    }

    // The statement rides along as context, the same way a selection does, so
    // the transcript shows a pill instead of a wall of inlined SQL.
    const context = contextForStatement(useEditorStore.getState().sql, pendingFix.sql);
    const text = `Fix this failing query.\n\nError:\n${pendingFix.error}`;

    clearFix();

    if (isBusy) {
      setInput(text);
      return;
    }

    void sendMessage({ text: withSelectionContext(text, context) });
  }, [pendingFix, clearFix, isBusy, sendMessage]);

  const submit = () => {
    const text = input.trim();

    if (text === '' || isBusy) {
      return;
    }

    // The selection travels with the message, so later steps still see it.
    const selection = describeSelection(useEditorStore.getState());

    void sendMessage({ text: withSelectionContext(text, selection) });
    setInput('');
  };

  /** Applies a held edit and lets the model's turn continue. */
  const approveEdit = async (toolCallId: string) => {
    const assistant = useAssistantStore.getState();
    const pending = assistant.pendingEdits[toolCallId];

    if (!pending) {
      return;
    }

    const output = await runEditorTool(pending.toolName, pending.input);
    assistant.clearPendingEdit(toolCallId);

    if (!output) {
      return;
    }

    if ('ok' in output && output.ok) {
      assistant.recordAppliedEdit(toolCallId, pending.preview);
    }

    void addToolResult({ tool: pending.toolName, toolCallId, output });
  };

  const rejectEdit = (toolCallId: string) => {
    const assistant = useAssistantStore.getState();
    const pending = assistant.pendingEdits[toolCallId];

    if (!pending) {
      return;
    }

    assistant.clearPendingEdit(toolCallId);
    void addToolResult({ tool: pending.toolName, toolCallId, output: rejectedByUser() });
  };

  const reset = () => {
    stop();
    setMessages([]);
    setInput('');
  };

  return {
    messages,
    status,
    error,
    input,
    setInput,
    submit,
    isBusy,
    stop,
    reset,
    approveEdit,
    rejectEdit,
  };
}

/** Tool parts carry their name as `tool-<name>`; this is the readable half. */
export function toolNameOf(part: ToolUIPart): string {
  return part.type.replace(/^tool-/, '');
}

export function messageToolParts(message: UIMessage): ToolUIPart[] {
  return message.parts.filter((part): part is ToolUIPart => part.type.startsWith('tool-'));
}

/**
 * Search progress streamed by the server, keyed by the tool call it belongs
 * to. Writing the same `id` replaces the part, so each call keeps one
 * growing list rather than a part per step.
 */
export function searchProgressByToolCall(message: UIMessage): Record<string, SearchStep[]> {
  const progress: Record<string, SearchStep[]> = {};

  for (const part of message.parts) {
    if (part.type !== 'data-search-progress') {
      continue;
    }

    const data = (part as { data?: { toolCallId?: string; steps?: SearchStep[] } }).data;

    if (data?.toolCallId && data.steps) {
      progress[data.toolCallId] = data.steps;
    }
  }

  return progress;
}
