/**
 * Splits editor contents into runnable statements.
 *
 * The buffer is scanned rather than split on `;`, because a semicolon means
 * nothing inside a string literal, a quoted identifier or a comment —
 * `WHERE note = 'a;b'` is one statement, not two. Segments that hold only
 * comments are dropped: a note after the last semicolon is not a statement,
 * and running it as one is an error the user never typed.
 */
export function splitStatements(sql: string): string[] {
  const statements: string[] = [];
  let start = 0;

  for (let index = 0; index < sql.length;) {
    const skipped = skipQuotedOrComment(sql, index);

    if (skipped > index) {
      index = skipped;
      continue;
    }

    if (sql[index] === ';') {
      statements.push(sql.slice(start, index));
      start = index + 1;
    }

    index += 1;
  }

  statements.push(sql.slice(start));

  return statements
    .map((statement) => statement.trim())
    .filter((statement) => withoutLeadingComments(statement) !== '');
}

/**
 * The end of the string, quoted identifier or comment starting at `index`,
 * or `index` itself when none starts there.
 *
 * Covers what ClickHouse accepts: `'...'` literals with doubled or
 * backslash-escaped quotes, `"..."` and backtick identifiers, `--` to the end
 * of the line, and `/* ... *\/` blocks, which do not nest.
 */
function skipQuotedOrComment(sql: string, index: number): number {
  const char = sql[index];

  if (char === "'" || char === '"' || char === '`') {
    let cursor = index + 1;

    while (cursor < sql.length) {
      if (sql[cursor] === '\\') {
        cursor += 2;
        continue;
      }

      if (sql[cursor] === char) {
        // A doubled quote is an escaped one, so the literal carries on.
        if (sql[cursor + 1] === char) {
          cursor += 2;
          continue;
        }

        return cursor + 1;
      }

      cursor += 1;
    }

    return sql.length;
  }

  if (char === '-' && sql[index + 1] === '-') {
    const newline = sql.indexOf('\n', index);

    return newline === -1 ? sql.length : newline;
  }

  if (char === '/' && sql[index + 1] === '*') {
    const end = sql.indexOf('*/', index + 2);

    return end === -1 ? sql.length : end + 2;
  }

  return index;
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
 *
 * Comments are skipped before the keyword is read. A query that opens with
 * `-- what this does` is still a SELECT, and the assistant writes commented
 * SQL by habit — judging it by its first word refused its own queries.
 */
export function isReadOnly(statement: string): boolean {
  const keyword = withoutLeadingComments(statement).split(/\s+/)[0]?.toLowerCase() ?? '';

  return READ_ONLY_PREFIXES.includes(keyword);
}

/** The statement from its first word of SQL, past any leading comments. */
function withoutLeadingComments(statement: string): string {
  let rest = statement.trimStart();

  for (;;) {
    const skipped =
      rest.startsWith('--') || rest.startsWith('/*') ? skipQuotedOrComment(rest, 0) : 0;

    if (skipped === 0) {
      return rest;
    }

    rest = rest.slice(skipped).trimStart();
  }
}
