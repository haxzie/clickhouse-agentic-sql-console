export type QueryRow = Record<string, unknown>;

export type Column = {
  name: string;
  type: string;
};

export type Database = {
  name: string;
  tables: string[];
};

export type QueryStatus = 'running' | 'success' | 'error';

export type QueryHistoryEntry = {
  id: string;
  sql: string;
  status: QueryStatus;
  /** Wall-clock duration reported by the API, in milliseconds. */
  durationMs?: number;
  rowCount?: number;
  error?: string;
  executedAt: number;
};

export type SidePanelTab = 'tables' | 'queries';

export type Connection = {
  id: string;
  name: string;
  url: string;
  username?: string;
  database?: string;
};

/** Add-connection form fields; `password` is write-only. */
export type ConnectionDraft = {
  name: string;
  url: string;
  username: string;
  password: string;
  database: string;
};
