import { SquarePen } from 'lucide-react';

import { IconButton } from '../common/IconButton.js';

type NewChatButtonProps = {
  onNewChat: () => void;
};

export function NewChatButton({ onNewChat }: NewChatButtonProps) {
  return (
    <IconButton label="New chat" onClick={onNewChat}>
      <SquarePen size={15} />
    </IconButton>
  );
}
