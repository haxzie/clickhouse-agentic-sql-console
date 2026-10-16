import { Download } from 'lucide-react';

import { downloadCsv } from '../../../lib/csv.js';
import { useQueryStore } from '../../../stores/useQueryStore.js';

/** Exports the full result set (not just the current page) as CSV. */
export function DownloadResultsButton() {
  const rows = useQueryStore((state) => state.rows);

  const onDownload = () => {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    downloadCsv(rows, `query-results-${stamp}.csv`);
  };

  return (
    <button
      type="button"
      onClick={onDownload}
      disabled={rows.length === 0}
      className="flex cursor-pointer items-center gap-1.5 text-neutral-500 hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-40"
    >
      <Download size={13} />
      Download CSV
    </button>
  );
}
