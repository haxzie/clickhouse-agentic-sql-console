import { FileUp } from 'lucide-react';
import { useRef } from 'react';

import { useEditorStore } from '../../../stores/useEditorStore.js';
import { IconButton } from '../common/IconButton.js';

/** Loads a .sql file from disk into the editor. */
export function OpenSqlFileButton() {
  const inputRef = useRef<HTMLInputElement>(null);
  const setSql = useEditorStore((state) => state.setSql);

  const onFileChosen = async (file: File | undefined) => {
    if (!file) {
      return;
    }

    setSql(await file.text());

    // Allow picking the same file again.
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".sql,text/plain"
        className="hidden"
        onChange={(event) => void onFileChosen(event.target.files?.[0])}
      />

      <IconButton label="Open SQL file" onClick={() => inputRef.current?.click()}>
        <FileUp size={15} />
      </IconButton>
    </>
  );
}
