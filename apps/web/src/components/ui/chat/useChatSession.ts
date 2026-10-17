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
import { useAssistantStore } from '../../../stores/useAssistantStore.js';

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
  const startNewChat = useAssistantStore((state) => state.startNewChat);

  // "Fix with AI" drafts a message rather than sending one, so the user stays
  // in control of what reaches the model.
  useEffect(() => {
    if (!pendingFix) {
      return;
    }

    setInput(
      `This ClickHouse query failed:\n\n\`\`\`sql\n${pendingFix.sql}\n\`\`\`\n\nError:\n${pendingFix.error}\n\nWhat is wrong and how do I fix it?`,
    );

    startNewChat();
  }, [pendingFix, startNewChat]);

  const isBusy = status === 'submitted' || status === 'streaming';

  const submit = () => {
    const text = input.trim();

    if (text === '' || isBusy) {
      return;
    }

    void sendMessage({ text });
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
