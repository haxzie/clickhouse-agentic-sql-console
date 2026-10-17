import { describe, expect, it } from 'vitest';

import { formatSql } from './formatSql.js';

describe('formatSql', () => {
  it('indents a query onto its own lines', () => {
    expect(formatSql('select a, b from t where a = 1')).toBe(
      'SELECT\n  a,\n  b\nFROM\n  t\nWHERE\n  a = 1',
    );
  });

  it('keeps ClickHouse function calls closed up', () => {
    const formatted = formatSql('select groupArray(x), uniqExact(y) from t');

    expect(formatted).toContain('groupArray(x)');
    expect(formatted).toContain('uniqExact(y)');
  });

  it('leaves keyword parentheses spaced', () => {
    expect(formatSql('select a from t where a in (1, 2)')).toContain('IN (1, 2)');
  });

  it('does not touch spacing inside string literals', () => {
    expect(formatSql("select 'call (x)' as s")).toContain("'call (x)'");
  });

  it('accepts ClickHouse cast syntax', () => {
    expect(formatSql('select a::Int32 from t')).toContain('a::Int32');
  });

  it('returns null for SQL it cannot parse', () => {
    expect(formatSql('select from where )(')).toBeNull();
  });

  it('returns null for an empty buffer', () => {
    expect(formatSql('   ')).toBeNull();
  });
});
