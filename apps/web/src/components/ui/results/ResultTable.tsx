import { ChevronDown, ChevronUp } from 'lucide-react';
import { useMemo, useState } from 'react';

import { useUiStore } from '../../../stores/useUiStore.js';
import type { QueryRow } from '../../../types/index.js';
import { ResultPagination } from './ResultPagination.js';

type ResultTableProps = {
  rows: QueryRow[];
};

type Sort = { column: string; direction: 'asc' | 'desc' } | null;

/** ClickHouse can return nested values; render them as compact JSON. */
function formatCell(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  return typeof value === 'object' ? JSON.stringify(value) : String(value);
}

/**
 * Result grid.
 *
 * A plain table rather than a grid library: `table-layout: auto` already does
 * what a result grid needs — size each column to its content, share any spare
 * width out so the table fills the pane, and overflow into a horizontal scroll
 * when the columns genuinely need more room. The cap below stops one long text
 * column from crowding out the rest.
 */
export function ResultTable({ rows }: ResultTableProps) {
  const wrapResultText = useUiStore((state) => state.wrapResultText);

  const [sort, setSort] = useState<Sort>(null);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [page, setPage] = useState(1);

  const columns = useMemo(() => Object.keys(rows[0] ?? {}), [rows]);
  const sorted = useMemo(() => sortRows(rows, sort), [rows, sort]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / rowsPerPage));
  const currentPage = Math.min(page, pageCount);
  const visible = sorted.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const toggleSort = (column: string) =>
    setSort((current) =>
      current?.column !== column
        ? { column, direction: 'asc' }
        : current.direction === 'asc'
          ? { column, direction: 'desc' }
          : null,
    );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div data-scroll-pane className="min-h-0 flex-1 overflow-auto overscroll-contain">
        <table className="w-full min-w-full border-collapse font-mono">
          <thead className="sticky top-0 z-10">
            <tr>
              {columns.map((column) => (
                <th
                  key={column}
                  scope="col"
                  aria-sort={
                    sort?.column === column
                      ? sort.direction === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : 'none'
                  }
                  className="text-sub border-b border-neutral-200 bg-neutral-50 p-0 text-left font-semibold tracking-wide text-neutral-500 uppercase"
                >
                  <button
                    type="button"
                    onClick={() => toggleSort(column)}
                    className="flex w-full cursor-pointer items-center gap-1 px-2.5 py-1.5 whitespace-nowrap hover:text-neutral-900"
                  >
                    {column}
                    {sort?.column === column &&
                      (sort.direction === 'asc' ? (
                        <ChevronUp size={11} />
                      ) : (
                        <ChevronDown size={11} />
                      ))}
                  </button>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {visible.map((row, index) => (
              <tr key={index} className="border-b border-neutral-100 even:bg-neutral-50/60">
                {columns.map((column) => (
                  <td key={column} className="max-w-100 px-2.5 py-1 align-top text-neutral-800">
                    <ResultCell value={formatCell(row[column])} wrap={wrapResultText} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ResultPagination
        rowCount={sorted.length}
        rowsPerPage={rowsPerPage}
        currentPage={currentPage}
        onChangePage={setPage}
        onChangeRowsPerPage={(size) => {
          setRowsPerPage(size);
          setPage(1);
        }}
      />
    </div>
  );
}

type ResultCellProps = {
  value: string;
  wrap: boolean;
};

/**
 * The cell fills whatever width the column was given and truncates there. The
 * cap is on the `<td>`, so a long column stops growing at that point instead
 * of clipping early and leaving the rest of the column empty.
 */
function ResultCell({ value, wrap }: ResultCellProps) {
  if (wrap) {
    return <div className="w-full break-words whitespace-normal">{value}</div>;
  }

  return <div className="w-full truncate">{value}</div>;
}

function sortRows(rows: QueryRow[], sort: Sort): QueryRow[] {
  if (!sort) {
    return rows;
  }

  const factor = sort.direction === 'asc' ? 1 : -1;

  return [...rows].sort((left, right) => {
    const a = left[sort.column];
    const b = right[sort.column];

    if (typeof a === 'number' && typeof b === 'number') {
      return (a - b) * factor;
    }

    return formatCell(a).localeCompare(formatCell(b), undefined, { numeric: true }) * factor;
  });
}
