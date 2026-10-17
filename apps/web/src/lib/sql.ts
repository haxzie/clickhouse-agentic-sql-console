/**
 * Splits editor contents into runnable statements.
 *
 * Naive on purpose: a `;` inside a string literal or comment would split
 * wrongly. Swap in a real parser if that becomes a problem.
 */
export function splitStatements(sql: string): string[] {
  return sql
    .split(';')
    .map((statement) => statement.trim())
    .filter((statement) => statement !== '');
}

export type RunTarget = {
  /** The text that Run will execute. */
  sql: string;
  statements: string[];
  /** True when only the highlighted text will run. */
  fromSelection: boolean;
};

/**
 * What a Run will actually execute: the selection when there is one, the whole
 * buffer otherwise. Shared by the button and the keyboard shortcut so they can
 * never disagree about what is about to happen.
 */
export function runTarget(state: {
  sql: string;
  selectionStart: number;
  selectionEnd: number;
}): RunTarget {
  const start = Math.min(state.selectionStart, state.selectionEnd);
  const end = Math.max(state.selectionStart, state.selectionEnd);
  const selected = state.sql.slice(start, end);
  const statements = splitStatements(selected);

  if (statements.length > 0) {
    return { sql: selected, statements, fromSelection: true };
  }

  return { sql: state.sql, statements: splitStatements(state.sql), fromSelection: false };
}

/** Statements the assistant may run itself: reads only. */
const READ_ONLY_PREFIXES = ['select', 'with', 'describe', 'desc', 'show', 'explain'];

/**
 * Whether a statement only reads.
 *
 * The assistant runs queries on the user's behalf, so it is held to reads;
 * anything that writes stays with the person who can see what it would do.
 */
export function isReadOnly(statement: string): boolean {
  const keyword = statement.trim().split(/\s+/)[0]?.toLowerCase() ?? '';

  return READ_ONLY_PREFIXES.includes(keyword);
}
