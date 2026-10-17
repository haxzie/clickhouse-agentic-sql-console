import { Check, ChevronDown, Hand } from 'lucide-react';

import { useAssistantStore, type EditApproval } from '../../../stores/useAssistantStore.js';

const OPTIONS: { value: EditApproval; label: string }[] = [
  { value: 'ask', label: 'Ask before edits' },
  { value: 'always', label: 'Always allow edits' },
];

/** Chooses whether the assistant's edits need approval before they apply. */
export function EditApprovalSelect() {
  const editApproval = useAssistantStore((state) => state.editApproval);
  const setEditApproval = useAssistantStore((state) => state.setEditApproval);

  return (
    <span className="text-sub relative inline-flex items-center gap-1 text-neutral-500">
      {editApproval === 'ask' ? (
        <Hand size={12} className="pointer-events-none absolute left-1.5" />
      ) : (
        <Check size={12} className="pointer-events-none absolute left-1.5" />
      )}

      <select
        value={editApproval}
        onChange={(event) => setEditApproval(event.target.value as EditApproval)}
        aria-label="Edit approval"
        className="cursor-pointer appearance-none rounded py-0.5 pr-4 pl-5 hover:bg-neutral-100 focus:outline-none"
      >
        {OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown size={12} className="pointer-events-none absolute right-1" />
    </span>
  );
}
