import { Check, Trash2 } from 'lucide-react';

import { useConnectionStore } from '../../../stores/useConnectionStore.js';
import type { Connection } from '../../../types/index.js';

type ConnectionOptionProps = {
  connection: Connection;
};

export function ConnectionOption({ connection }: ConnectionOptionProps) {
  const activeId = useConnectionStore((state) => state.activeId);
  const setActive = useConnectionStore((state) => state.setActive);
  const remove = useConnectionStore((state) => state.remove);

  const isActive = connection.id === activeId;

  return (
    <li className="flex items-center gap-1 hover:bg-neutral-50">
      <button
        type="button"
        role="option"
        aria-selected={isActive}
        onClick={() => setActive(connection.id)}
        className="min-w-0 flex-1 cursor-pointer px-2 py-1.5 text-left"
      >
        <span className="flex items-center gap-1.5">
          <span className="flex w-3 shrink-0 justify-center text-neutral-900">
            {isActive && <Check size={12} />}
          </span>
          <span className="truncate text-neutral-900">{connection.name}</span>
        </span>
        <span className="text-sub block truncate pl-4.5 text-neutral-400">{connection.url}</span>
      </button>

      <button
        type="button"
        onClick={() => void remove(connection.id)}
        aria-label={`Delete ${connection.name}`}
        title={`Delete ${connection.name}`}
        className="mr-1 shrink-0 cursor-pointer rounded px-1.5 py-1 text-neutral-400 hover:bg-red-50 hover:text-red-600"
      >
        <Trash2 size={13} />
      </button>
    </li>
  );
}
