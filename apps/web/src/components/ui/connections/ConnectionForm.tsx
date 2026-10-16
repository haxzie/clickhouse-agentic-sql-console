import type { FormEvent } from 'react';

import { useConnectionStore } from '../../../stores/useConnectionStore.js';
import { TextField } from '../common/TextField.js';

export function ConnectionForm() {
  const draft = useConnectionStore((state) => state.draft);
  const updateDraft = useConnectionStore((state) => state.updateDraft);
  const save = useConnectionStore((state) => state.save);
  const isSaving = useConnectionStore((state) => state.isSaving);
  const error = useConnectionStore((state) => state.error);
  const closeModal = useConnectionStore((state) => state.closeModal);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void save();
  };

  return (
    <form onSubmit={onSubmit}>
      <div className="flex flex-col gap-3 px-4 py-4">
        <TextField
          label="Name"
          value={draft.name}
          onChange={(value) => updateDraft('name', value)}
          placeholder="Production"
          required
        />
        <TextField
          label="HTTP URL"
          value={draft.url}
          onChange={(value) => updateDraft('url', value)}
          placeholder="http://localhost:8123"
          required
        />
        <TextField
          label="Username"
          value={draft.username}
          onChange={(value) => updateDraft('username', value)}
          placeholder="default"
        />
        <TextField
          label="Password"
          type="password"
          value={draft.password}
          onChange={(value) => updateDraft('password', value)}
        />
        <TextField
          label="Database"
          value={draft.database}
          onChange={(value) => updateDraft('database', value)}
          placeholder="default"
        />

        {error && (
          <p role="alert" className="text-red-600">
            {error}
          </p>
        )}

        <p className="text-sub text-neutral-400">
          Passwords are encrypted before being written to the API's local database and are never
          sent back to the browser.
        </p>
      </div>

      <div className="flex justify-end gap-2 border-t border-neutral-200 px-4 py-3">
        <button
          type="button"
          onClick={closeModal}
          className="cursor-pointer rounded px-3 py-1.5 text-neutral-600 hover:bg-neutral-100"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="cursor-pointer rounded bg-neutral-900 px-3 py-1.5 font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
        >
          {isSaving ? 'Adding…' : 'Add connection'}
        </button>
      </div>
    </form>
  );
}
