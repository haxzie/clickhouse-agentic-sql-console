import { Plus } from 'lucide-react';

import { useConnectionStore } from '../../../stores/useConnectionStore.js';
import { ConnectionOption } from './ConnectionOption.js';

export function ConnectionDropdown() {
  const connections = useConnectionStore((state) => state.connections);
  const error = useConnectionStore((state) => state.error);
  const openModal = useConnectionStore((state) => state.openModal);
  const closePicker = useConnectionStore((state) => state.closePicker);

  return (
    <>
      {/* Click-away target; sits under the menu but above the rest of the app. */}
      <div role="presentation" onClick={closePicker} className="fixed inset-0 z-10" />

      <div
        role="listbox"
        className="absolute top-full right-0 left-0 z-20 overflow-hidden border-b border-neutral-200 bg-white shadow-lg"
      >
        <ul className="max-h-64 overflow-auto">
          {connections.map((connection) => (
            <ConnectionOption key={connection.id} connection={connection} />
          ))}
        </ul>

        {error && (
          <p role="alert" className="px-2 py-1.5 text-red-600">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={openModal}
          className="flex w-full cursor-pointer items-center gap-1.5 border-t border-neutral-200 px-2 py-2 text-left font-medium text-neutral-700 hover:bg-neutral-50"
        >
          <Plus size={13} />
          Add connection
        </button>
      </div>
    </>
  );
}
