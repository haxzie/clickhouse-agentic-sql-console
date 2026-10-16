import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import type { PaginationComponentProps } from 'react-data-table-component';

import { DownloadResultsButton } from './DownloadResultsButton.js';

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

/**
 * Replaces react-data-table's pagination so the row count can sit on the left
 * and the controls match the rest of the console.
 */
export function ResultPagination({
  rowsPerPage,
  rowCount,
  currentPage,
  onChangePage,
  onChangeRowsPerPage,
}: PaginationComponentProps) {
  const lastPage = Math.max(1, Math.ceil(rowCount / rowsPerPage));
  const firstRow = rowCount === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const lastRow = Math.min(currentPage * rowsPerPage, rowCount);

  const isFirstPage = currentPage <= 1;
  const isLastPage = currentPage >= lastPage;

  return (
    <nav
      data-pagination
      aria-label="Table pagination"
      className="text-sub flex h-9 shrink-0 items-center justify-between border-t border-neutral-200 bg-white px-3 text-neutral-500"
    >
      <div className="flex items-center gap-3">
        <DownloadResultsButton />

        {/* Short rule separating the action from the row count. */}
        <span aria-hidden className="h-4 w-px bg-neutral-200" />

        <span>
          {rowCount} {rowCount === 1 ? 'row' : 'rows'}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <label className="flex items-center gap-1.5">
          Rows per page
          <select
            value={rowsPerPage}
            onChange={(event) => onChangeRowsPerPage(Number(event.target.value), currentPage)}
            className="cursor-pointer rounded border border-neutral-200 px-1 py-0.5 text-neutral-700"
          >
            {ROWS_PER_PAGE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <span className="tabular-nums">
          {firstRow}-{lastRow} of {rowCount}
        </span>

        <span className="flex items-center gap-0.5">
          <PageButton
            label="First page"
            disabled={isFirstPage}
            onClick={() => onChangePage(1, rowCount)}
          >
            <ChevronsLeft size={14} />
          </PageButton>
          <PageButton
            label="Previous page"
            disabled={isFirstPage}
            onClick={() => onChangePage(currentPage - 1, rowCount)}
          >
            <ChevronLeft size={14} />
          </PageButton>
          <PageButton
            label="Next page"
            disabled={isLastPage}
            onClick={() => onChangePage(currentPage + 1, rowCount)}
          >
            <ChevronRight size={14} />
          </PageButton>
          <PageButton
            label="Last page"
            disabled={isLastPage}
            onClick={() => onChangePage(lastPage, rowCount)}
          >
            <ChevronsRight size={14} />
          </PageButton>
        </span>
      </div>
    </nav>
  );
}

type PageButtonProps = {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
};

function PageButton({ label, disabled, onClick, children }: PageButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="flex size-6 cursor-pointer items-center justify-center rounded text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}
