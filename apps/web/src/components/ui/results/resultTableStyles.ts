/**
 * Light-theme overrides so react-data-table matches the rest of the console.
 * Sizing follows the app-wide tokens: `--text-app` for cells and `--text-sub`
 * for headers.
 */
export const resultTableStyles = {
  table: {
    style: { fontFamily: 'inherit' },
  },
  headRow: {
    style: {
      minHeight: '32px',
      borderBottomColor: 'var(--color-neutral-200)',
      backgroundColor: 'var(--color-neutral-50)',
    },
  },
  headCells: {
    style: {
      fontSize: 'var(--text-sub)',
      fontWeight: 600,
      color: 'var(--color-neutral-500)',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.04em',
    },
  },
  rows: {
    style: {
      minHeight: '30px',
      fontSize: 'var(--text-app)',
      fontFamily: 'ui-monospace, monospace',
      color: 'var(--color-neutral-800)',
      borderBottomColor: 'var(--color-neutral-100)',
    },
    stripedStyle: { backgroundColor: 'var(--color-neutral-50)' },
    highlightOnHoverStyle: {
      backgroundColor: 'var(--color-neutral-100)',
      borderBottomColor: 'var(--color-neutral-200)',
      outline: 'none',
    },
  },
};
