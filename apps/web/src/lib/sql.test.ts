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

describe('isReadOnly with comments', () => {
  it('sees past a leading line comment', () => {
    expect(isReadOnly('-- products below their reorder level\nSELECT * FROM products')).toBe(true);
  });

  it('sees past several of them', () => {
    expect(isReadOnly('-- one\n-- two\n  SELECT 1')).toBe(true);
  });

  it('sees past a block comment', () => {
    expect(isReadOnly('/* what this does */ SELECT 1')).toBe(true);
  });

  it('still refuses a write hidden behind a comment', () => {
    expect(isReadOnly('-- harmless\nDROP TABLE orders')).toBe(false);
  });

  it('refuses a statement that is only a comment', () => {
    expect(isReadOnly('-- nothing to run')).toBe(false);
  });
});

describe('splitStatements with comments', () => {
  it('ignores a comment after the last semicolon', () => {
    expect(splitStatements('SELECT 1; -- keep only the top 5')).toEqual(['SELECT 1']);
  });

  it('ignores a comment-only buffer', () => {
    expect(splitStatements('-- nothing to run here\n')).toEqual([]);
  });

  it('keeps a trailing comment that belongs to its statement', () => {
    expect(splitStatements('SELECT 1 -- the answer')).toEqual(['SELECT 1 -- the answer']);
  });

  it('keeps a statement introduced by a comment', () => {
    expect(splitStatements('-- why\nSELECT 1;\n-- and again\nSELECT 2')).toEqual([
      '-- why\nSELECT 1',
      '-- and again\nSELECT 2',
    ]);
  });
});

describe('splitStatements with semicolons that are not separators', () => {
  it('keeps a semicolon inside a string literal', () => {
    expect(splitStatements("SELECT * FROM t WHERE note = 'a;b'")).toEqual([
      "SELECT * FROM t WHERE note = 'a;b'",
    ]);
  });

  it('keeps a semicolon inside a quoted identifier', () => {
    expect(splitStatements('SELECT `odd;name` FROM t')).toEqual(['SELECT `odd;name` FROM t']);
  });

  it('keeps a semicolon inside a line comment', () => {
    expect(splitStatements('SELECT 1 -- end; really\nFROM t')).toEqual([
      'SELECT 1 -- end; really\nFROM t',
    ]);
  });

  it('keeps a semicolon inside a block comment', () => {
    expect(splitStatements('SELECT /* a; b */ 1')).toEqual(['SELECT /* a; b */ 1']);
  });

  it('survives a doubled quote inside a literal', () => {
    expect(splitStatements("SELECT 'it''s here; still one'")).toEqual([
      "SELECT 'it''s here; still one'",
    ]);
  });

  it('still splits on a real separator', () => {
    expect(splitStatements("SELECT 'a;b'; SELECT 2")).toEqual(["SELECT 'a;b'", 'SELECT 2']);
  });

  it('splits the commented query from the editor into one statement', () => {
    const buffer = [
      '-- 5 cheapest products by current list price',
      'SELECT',
      '    product_id,      -- unique product identifier',
      '    unit_price       -- current list price',
      'FROM northwind.products',
      'ORDER BY unit_price ASC',
      'LIMIT 5;             -- keep only the top 5',
    ].join('\n');

    expect(splitStatements(buffer)).toHaveLength(1);
  });
});
