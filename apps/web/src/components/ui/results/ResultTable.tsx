import { useMemo } from 'react';
import DataTable, { type TableColumn } from 'react-data-table-component';

import type { QueryRow } from '../../../types/index.js';
import { ResultPagination } from './ResultPagination.js';
import { resultTableStyles } from './resultTableStyles.js';

type ResultTableProps = {
  rows: QueryRow[];
};

/** ClickHouse can return nested values; render them as compact JSON. */
function formatCell(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  return typeof value === 'object' ? JSON.stringify(value) : String(value);
}

export function ResultTable({ rows }: ResultTableProps) {
  const columns = useMemo<TableColumn<QueryRow>[]>(
    () =>
      Object.keys(rows[0] ?? {}).map((key) => ({
        name: key,
        selector: (row: QueryRow) => formatCell(row[key]),
        sortable: true,
        wrap: true,
      })),
    [rows],
  );

  return (
    <DataTable
      columns={columns}
      data={rows}
      dense
      striped
      highlightOnHover
      pagination
      paginationPerPage={25}
      paginationComponent={ResultPagination}
      customStyles={resultTableStyles}
    />
  );
}
