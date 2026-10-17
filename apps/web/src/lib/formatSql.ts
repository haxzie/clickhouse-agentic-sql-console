import { format } from 'sql-formatter';

/**
 * Pretty-prints the editor's SQL.
 *
 * `sql-formatter` has no ClickHouse dialect; PostgreSQL is the closest one it
 * ships — it accepts `::` casts and leaves ClickHouse-only clauses alone
 * rather than refusing the statement. Formatting only moves whitespace and
 * cases keywords, so nothing the query means can change.
 *
 * Returns `null` when the text cannot be parsed, which is the common case
 * mid-edit; the caller leaves the buffer alone rather than mangling it.
 */
export function formatSql(sql: string): string | null {
  if (sql.trim() === '') {
    return null;
  }

  try {
    return closeFunctionCalls(
      format(sql, { language: 'postgresql', keywordCase: 'upper', tabWidth: 2 }),
    );
  } catch {
    return null;
  }
}

/**
 * Removes the space the formatter puts before `(` in calls it does not know,
 * so `groupArray (x)` reads as `groupArray(x)` again. Keywords stay as they
 * are: with `keywordCase: 'upper'` an all-caps word before a paren is `IN (`
 * or `JOIN (`, never a ClickHouse function.
 *
 * Quoted text and comments are skipped so a space inside a string literal
 * survives.
 */
function closeFunctionCalls(sql: string): string {
  let out = '';
  let index = 0;

  while (index < sql.length) {
    const char = sql[index];
    const span = skipSpan(sql, index);

    if (span > index) {
      out += sql.slice(index, span);
      index = span;
      continue;
    }

    if (char === '(') {
      const call = /([A-Za-z_][A-Za-z0-9_$]*) $/.exec(out);

      if (call && call[1] !== call[1].toUpperCase()) {
        out = out.slice(0, -1);
      }
    }

    out += char;
    index += 1;
  }

  return out;
}

/**
 * The end of the string, quoted identifier or comment starting at `index`, or
 * `index` itself when nothing starts there.
 */
function skipSpan(sql: string, index: number): number {
  const char = sql[index];

  if (char === "'" || char === '"' || char === '`') {
    let cursor = index + 1;

    while (cursor < sql.length) {
      if (sql[cursor] === '\\') {
        cursor += 2;
        continue;
      }

      if (sql[cursor] === char) {
        // A doubled quote is an escaped one, so the span carries on.
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
    const end = sql.indexOf('\n', index);

    return end === -1 ? sql.length : end;
  }

  if (char === '/' && sql[index + 1] === '*') {
    const end = sql.indexOf('*/', index + 2);

    return end === -1 ? sql.length : end + 2;
  }

  return index;
}
