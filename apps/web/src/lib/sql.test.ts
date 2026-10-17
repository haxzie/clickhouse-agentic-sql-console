import { describe, expect, it } from 'vitest';

import { isReadOnly, runTarget, splitStatements } from './sql.js';

describe('splitStatements', () => {
  it('splits on semicolons and drops the empties', () => {
    expect(splitStatements('SELECT 1; SELECT 2;')).toEqual(['SELECT 1', 'SELECT 2']);
  });

  it('returns nothing for separators alone', () => {
    expect(splitStatements('  ;  ; ')).toEqual([]);
  });
});

describe('runTarget', () => {
  const sql = 'SELECT 1;\nSELECT 2;\nSELECT 3';

  it('runs the whole buffer when nothing is selected', () => {
    const target = runTarget({ sql, selectionStart: 4, selectionEnd: 4 });

    expect(target).toEqual({
      sql,
      statements: ['SELECT 1', 'SELECT 2', 'SELECT 3'],
      fromSelection: false,
    });
  });

  it('runs only the selection when there is one', () => {
    // "SELECT 2" sits between the first and second semicolons.
    const target = runTarget({ sql, selectionStart: 10, selectionEnd: 18 });

    expect(target).toEqual({ sql: 'SELECT 2', statements: ['SELECT 2'], fromSelection: true });
  });

  it('counts several selected statements', () => {
    const target = runTarget({ sql, selectionStart: 0, selectionEnd: 19 });

    expect(target.statements).toEqual(['SELECT 1', 'SELECT 2']);
    expect(target.fromSelection).toBe(true);
  });

  it('falls back to the buffer when the selection holds no statement', () => {
    const target = runTarget({ sql, selectionStart: 9, selectionEnd: 10 }); // just a newline

    expect(target.fromSelection).toBe(false);
    expect(target.statements).toHaveLength(3);
  });
});

describe('isReadOnly', () => {
  it.each([
    'SELECT 1',
    'with x as (select 1) select * from x',
    'DESCRIBE t',
    'SHOW TABLES',
    'EXPLAIN SELECT 1',
  ])('allows %s', (statement) => {
    expect(isReadOnly(statement)).toBe(true);
  });

  it.each([
    'INSERT INTO t VALUES (1)',
    'DROP TABLE t',
    'ALTER TABLE t DELETE WHERE 1',
    'TRUNCATE TABLE t',
  ])('refuses %s', (statement) => {
    expect(isReadOnly(statement)).toBe(false);
  });
});
