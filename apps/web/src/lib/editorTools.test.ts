import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useEditorStore } from '../stores/useEditorStore.js';
import { useQueryStore } from '../stores/useQueryStore.js';
import {
  getEditorState,
  getLastError,
  insertAtCursor,
  replaceSelection,
  setQuery,
  strReplace,
} from './editorTools.js';

/** Edits validate against the API; these tests are about the edit semantics. */
const stubValidation = (body: unknown = { valid: true }) => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify(body), { status: 200 })),
  );
};

const reset = (sql: string) => {
  useEditorStore.setState({ sql, version: 1, selectionStart: 0, selectionEnd: 0 });
  useQueryStore.setState({ history: [], error: null });
  stubValidation();
};

describe('getEditorState', () => {
  beforeEach(() => reset('SELECT 1\nFROM t'));

  it('numbers the lines', () => {
    expect(getEditorState().numberedSql).toBe('1\tSELECT 1\n2\tFROM t');
  });

  it('reports the cursor as line and column', () => {
    useEditorStore.setState({ selectionStart: 11, selectionEnd: 11 });

    expect(getEditorState().cursor).toEqual({ line: 2, column: 3, offset: 11 });
  });

  it('reports the selected text', () => {
    useEditorStore.setState({ selectionStart: 0, selectionEnd: 6 });
    const { selection } = getEditorState();

    expect(selection.text).toBe('SELECT');
    expect(selection.isEmpty).toBe(false);
  });
});

describe('str_replace', () => {
  beforeEach(() => reset('SELECT a FROM t'));

  it('replaces a unique match and bumps the version', async () => {
    const result = await strReplace('a', 'b', 1);

    expect(result.ok).toBe(true);
    expect(useEditorStore.getState().sql).toBe('SELECT b FROM t');
    expect(result.state.version).toBe(2);
  });

  it('refuses an ambiguous match', async () => {
    reset('SELECT a, a FROM t');
    const result = await strReplace('a', 'b', 1);

    expect(result.ok).toBe(false);
    expect(result).toHaveProperty('error', expect.stringContaining('more than once'));
    expect(useEditorStore.getState().sql).toBe('SELECT a, a FROM t');
  });

  it('refuses a missing match', async () => {
    const result = await strReplace('nope', 'b', 1);

    expect(result.ok).toBe(false);
    expect(result).toHaveProperty('error', expect.stringContaining('No match'));
  });

  it('rejects an edit planned against a stale version', async () => {
    useEditorStore.getState().setSql('SELECT a FROM t2'); // the user typed
    const result = await strReplace('a', 'b', 1);

    expect(result.ok).toBe(false);
    expect(result).toHaveProperty('error', expect.stringContaining('changed since version 1'));
    expect(useEditorStore.getState().sql).toBe('SELECT a FROM t2');
  });
});

describe('selection and cursor edits', () => {
  beforeEach(() => reset('SELECT a FROM t'));

  it('replaces the selection', async () => {
    useEditorStore.setState({ selectionStart: 7, selectionEnd: 8 });
    const result = await replaceSelection('count()', 1);

    expect(result.ok).toBe(true);
    expect(useEditorStore.getState().sql).toBe('SELECT count() FROM t');
  });

  it('refuses to replace an empty selection', async () => {
    const result = await replaceSelection('x', 1);

    expect(result.ok).toBe(false);
    expect(result).toHaveProperty('error', expect.stringContaining('Nothing is selected'));
  });

  it('inserts at the cursor', async () => {
    useEditorStore.setState({ selectionStart: 6, selectionEnd: 6 });
    const result = await insertAtCursor(' DISTINCT', 1);

    expect(result.ok).toBe(true);
    expect(useEditorStore.getState().sql).toBe('SELECT DISTINCT a FROM t');
  });

  it('rewrites the whole buffer', async () => {
    const result = await setQuery('SELECT 2', 1);

    expect(result.ok).toBe(true);
    expect(useEditorStore.getState().sql).toBe('SELECT 2');
  });
});

describe('edit validation', () => {
  beforeEach(() => reset('SELECT a FROM t'));

  it('reports a valid buffer after the edit', async () => {
    const result = await setQuery('SELECT 1', 1);

    expect(result).toHaveProperty('validation', { valid: true });
  });

  it('surfaces the server error when the edit breaks the query', async () => {
    stubValidation({
      valid: false,
      statement: 'SELCT 1',
      error: "Syntax error: failed at 'SELCT'",
    });
    const result = await setQuery('SELCT 1', 1);

    // The edit still applied; the model is told what it broke.
    expect(result.ok).toBe(true);
    expect(useEditorStore.getState().sql).toBe('SELCT 1');
    expect(result).toHaveProperty('validation.valid', false);
    expect(result).toHaveProperty('validation.error', expect.stringContaining('Syntax error'));
  });

  it('says so when validation itself could not run', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network down');
      }),
    );
    const result = await setQuery('SELECT 1', 1);

    expect(result.ok).toBe(true);
    expect(result).toHaveProperty('validation.valid', null);
  });
});

describe('get_last_error', () => {
  beforeEach(() => reset('SELECT 1'));

  it('reports no error on a clean session', () => {
    expect(getLastError()).toEqual({ hasError: false });
  });

  it('returns the most recent failure with the statement that caused it', () => {
    useQueryStore.setState({
      history: [
        {
          id: '2',
          sql: 'SELECT nocol FROM t',
          status: 'error',
          error: "Missing columns: 'nocol'",
          executedAt: 1_760_000_000_000,
        },
        { id: '1', sql: 'SELECT 1', status: 'success', rowCount: 1, executedAt: 1 },
      ],
    });

    expect(getLastError()).toEqual({
      hasError: true,
      error: "Missing columns: 'nocol'",
      sql: 'SELECT nocol FROM t',
      executedAt: new Date(1_760_000_000_000).toISOString(),
    });
  });
});
