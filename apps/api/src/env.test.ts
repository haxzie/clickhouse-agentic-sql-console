import { describe, expect, it } from 'vitest';

import { parseEnv } from './env.js';

const valid = { ANTHROPIC_API_KEY: 'sk-ant-test' };

describe('parseEnv', () => {
  it('fills in the defaults', () => {
    const env = parseEnv(valid);

    expect(env).toMatchObject({
      NODE_ENV: 'development',
      CLICKHOUSE_URL: 'http://localhost:8123',
      PORT: 8080,
      WEB_ORIGIN: 'http://localhost:5173',
      CHAT_MODEL: 'claude-opus-5-5',
      SEARCH_MODEL: 'claude-haiku-4-5-20251001',
    });
  });

  it('reads the port as a number', () => {
    expect(parseEnv({ ...valid, PORT: '3001' }).PORT).toBe(3001);
  });

  it('resolves the database path against the API package, not the cwd', () => {
    expect(parseEnv({ ...valid, DATABASE_PATH: 'data/app.db' }).DATABASE_PATH).toMatch(
      /apps\/api\/data\/app\.db$/,
    );
  });

  it('leaves an absolute database path alone', () => {
    expect(parseEnv({ ...valid, DATABASE_PATH: '/tmp/other.db' }).DATABASE_PATH).toBe(
      '/tmp/other.db',
    );
  });

  it('rejects a port that is not a number', () => {
    expect(() => parseEnv({ ...valid, PORT: 'abc' })).toThrow(/PORT/);
  });

  it.each([
    'http://localhost:8123',
    'http://127.0.0.1:8123',
    'https://abc.ap-south-1.aws.clickhouse.cloud:8443',
  ])('accepts %s', (url) => {
    expect(parseEnv({ ...valid, CLICKHOUSE_URL: url }).CLICKHOUSE_URL).toBe(url);
  });

  it('rejects a URL that is not one', () => {
    expect(() => parseEnv({ ...valid, CLICKHOUSE_URL: 'localhost:8123' })).toThrow(
      /CLICKHOUSE_URL/,
    );
  });

  it('requires an Anthropic key to start', () => {
    expect(() => parseEnv({})).toThrow(/ANTHROPIC_API_KEY/);
  });

  it('runs without one under test, where nothing reaches Anthropic', () => {
    expect(parseEnv({ NODE_ENV: 'test' }).ANTHROPIC_API_KEY).toBeUndefined();
  });

  it('falls back to a development encryption key outside production', () => {
    expect(parseEnv(valid).ENCRYPTION_KEY).toBe('dev-insecure-encryption-key');
  });

  it('demands a real encryption key in production', () => {
    expect(() => parseEnv({ ...valid, NODE_ENV: 'production' })).toThrow(/ENCRYPTION_KEY/);
  });

  it('names every malformed variable at once', () => {
    const failure = () => parseEnv({ ...valid, PORT: 'abc', WEB_ORIGIN: 'nope' });

    expect(failure).toThrow(/PORT/);
    expect(failure).toThrow(/WEB_ORIGIN/);
  });
});
