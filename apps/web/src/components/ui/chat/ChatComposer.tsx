import { ArrowUp, Square } from 'lucide-react';

import { EditApprovalSelect } from './EditApprovalSelect.js';
import { useRef, type KeyboardEvent } from 'react';

type ChatComposerProps = {
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
  onStop: () => void;
  isBusy: boolean;
};

/** Floating composer: a white card over the panel, with the send button inside. */
export function ChatComposer({
  input,
  onInputChange,
  onSubmit,
  onStop,
  isBusy,
}: ChatComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter sends; shift+enter keeps the newline.
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      onSubmit();
    }
  };

  const canSend = input.trim() !== '' && !isBusy;

  return (
    <div className="shrink-0 p-3">
      <div className="flex flex-col rounded-xl border border-neutral-200 bg-white p-2 shadow-sm focus-within:border-neutral-300">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(event) => onInputChange(event.target.value)}
          onKeyDown={onKeyDown}
          rows={2}
          placeholder="Describe the query you need…"
          aria-label="Message the assistant"
          className="max-h-40 w-full resize-none bg-transparent px-1 py-1 outline-none placeholder:text-neutral-400"
        />

        <div className="flex items-center justify-between gap-2">
          <EditApprovalSelect />

          {isBusy ? (
            <button
              type="button"
              onClick={onStop}
              aria-label="Stop generating"
              title="Stop generating"
              className="flex size-7 cursor-pointer items-center justify-center rounded-full bg-neutral-900 text-white hover:bg-neutral-700"
            >
              <Square size={11} fill="currentColor" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onSubmit}
              disabled={!canSend}
              aria-label="Send message"
              title="Send message"
              className="flex size-7 cursor-pointer items-center justify-center rounded-full bg-neutral-900 text-white hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ArrowUp size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
