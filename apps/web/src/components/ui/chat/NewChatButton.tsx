import { SquarePen } from 'lucide-react';

import { useAssistantStore } from '../../../stores/useAssistantStore.js';
import { IconButton } from '../common/IconButton.js';

export function NewChatButton() {
  const startNewChat = useAssistantStore((state) => state.startNewChat);

  return (
    <IconButton label="New chat" onClick={startNewChat}>
      <SquarePen size={15} />
    </IconButton>
  );
}
