import { describe, expect, it } from 'vitest';

import { prepareSample } from './runSql.js';

describe('prepareSample', () => {
  it('caps a SELECT with an outer LIMIT', () => {
    expect(prepareSample('SELECT * FROM default.orders')).toEqual({
      query: 'SELECT * FROM (SELECT * FROM default.orders) LIMIT 50',
    });
  });

  it('caps a CTE too', () => {
    const result = prepareSample('WITH x AS (SELECT 1) SELECT * FROM x');

    expect(result).toHaveProperty('query', expect.stringContaining('LIMIT 50'));
  });

  it('caps a query that already has its own larger LIMIT', () => {
    const result = prepareSample('SELECT * FROM default.orders LIMIT 10000');

    expect(result).toEqual({
      query: 'SELECT * FROM (SELECT * FROM default.orders LIMIT 10000) LIMIT 50',
    });
  });

  it('leaves DESCRIBE and SHOW alone, since they are already small', () => {
    expect(prepareSample('DESCRIBE TABLE default.orders')).toEqual({
      query: 'DESCRIBE TABLE default.orders',
    });
    expect(prepareSample('SHOW TABLES')).toEqual({ query: 'SHOW TABLES' });
  });

  it('tolerates a trailing semicolon', () => {
    expect(prepareSample('SELECT 1;')).toHaveProperty('query', 'SELECT * FROM (SELECT 1) LIMIT 50');
  });

  it.each([
    ['INSERT INTO default.orders VALUES (1)', 'INSERT'],
    ['DROP TABLE default.orders', 'DROP'],
    ['ALTER TABLE default.orders DELETE WHERE 1', 'ALTER'],
    ['TRUNCATE TABLE default.orders', 'TRUNCATE'],
    ['CREATE TABLE x (a UInt8) ENGINE = Memory', 'CREATE'],
    ['SYSTEM SHUTDOWN', 'SYSTEM'],
  ])('rejects %s', (sql, keyword) => {
    expect(prepareSample(sql)).toEqual({ error: expect.stringContaining(keyword) });
  });

  it('rejects multiple statements', () => {
    expect(prepareSample('SELECT 1; DROP TABLE default.orders')).toEqual({
      error: expect.stringContaining('one statement per call'),
    });
  });

  it('rejects a FORMAT clause, which would fight the tool output', () => {
    expect(prepareSample('SELECT 1 FORMAT JSON')).toEqual({
      error: expect.stringContaining('FORMAT'),
    });
  });

  it('rejects an empty query', () => {
    expect(prepareSample('   ')).toEqual({ error: 'Empty query.' });
  });
});
