import type { QueryRow } from '../types/index.js';

function escapeCell(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  const text = typeof value === 'object' ? JSON.stringify(value) : String(value);

  // Quote anything that could break the row/column structure.
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function toCsv(rows: QueryRow[]): string {
  if (rows.length === 0) {
    return '';
  }

  const columns = Object.keys(rows[0]);
  const header = columns.map(escapeCell).join(',');
  const body = rows.map((row) => columns.map((column) => escapeCell(row[column])).join(','));

  return [header, ...body].join('\n');
}

export function downloadCsv(rows: QueryRow[], filename: string): void {
  const blob = new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}
