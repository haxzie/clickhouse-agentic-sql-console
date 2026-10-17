import { describe, expect, it } from 'vitest';

import {
  contextForStatement,
  describeSelection,
  selectionLabel,
  splitSelectionContext,
  withSelectionContext,
} from './selectionContext.js';

const sql = 'SELECT a\nFROM t\nWHERE x = 1';

describe('describeSelection', () => {
  it('returns null when nothing is selected', () => {
    expect(describeSelection({ sql, selectionStart: 4, selectionEnd: 4 })).toBeNull();
  });

  it('returns null for a whitespace-only selection', () => {
    expect(describeSelection({ sql: 'a   b', selectionStart: 1, selectionEnd: 4 })).toBeNull();
  });

  it('reports the line range and size', () => {
    // "FROM t\nWHERE x = 1" starts on line 2.
    const selection = describeSelection({ sql, selectionStart: 9, selectionEnd: sql.length });

    expect(selection).toEqual({
      text: 'FROM t\nWHERE x = 1',
      startLine: 2,
      endLine: 3,
      charCount: 18,
    });
  });

  it('handles a backwards selection', () => {
    const selection = describeSelection({ sql, selectionStart: 8, selectionEnd: 0 });

    expect(selection?.text).toBe('SELECT a');
  });
});

describe('contextForStatement', () => {
  it('finds the statement in the buffer and numbers its lines', () => {
    const buffer = 'SELECT 1;\nSELECT 2;\nSELECT 3';

    expect(contextForStatement(buffer, 'SELECT 2')).toEqual({
      text: 'SELECT 2',
      startLine: 2,
      endLine: 2,
      charCount: 8,
    });
  });

  it('spans the lines of a multi-line statement', () => {
    const buffer = 'SELECT a\nFROM t\nWHERE x';

    expect(contextForStatement(buffer, 'FROM t\nWHERE x')).toMatchObject({
      startLine: 2,
      endLine: 3,
    });
  });

  it('falls back to line 1 when the statement is no longer in the buffer', () => {
    expect(contextForStatement('SELECT 9', 'SELECT 1')).toMatchObject({
      startLine: 1,
      endLine: 1,
    });
  });
});

describe('selectionLabel', () => {
  it('reads naturally for one line', () => {
    expect(selectionLabel({ text: 'a', startLine: 3, endLine: 3, charCount: 1 })).toBe(
      'Line 3 selected · 1 chars',
    );
  });

  it('reads naturally for a range', () => {
    expect(selectionLabel({ text: 'a', startLine: 2, endLine: 5, charCount: 40 })).toBe(
      'Lines 2-5 selected · 40 chars',
    );
  });
});

describe('message context', () => {
  it('records the line range in the tag', () => {
    const message = withSelectionContext('fix', {
      text: 'FROM t',
      startLine: 4,
      endLine: 6,
      charCount: 6,
    });

    expect(message.startsWith('<selected-sql lines="4-6">')).toBe(true);
    expect(splitSelectionContext(message).context).toMatchObject({ startLine: 4, endLine: 6 });
  });

  it('round-trips the selection and the typed text', () => {
    const selection = { text: 'FROM t', startLine: 2, endLine: 2, charCount: 6 };
    const message = withSelectionContext('why is this slow?', selection);

    expect(splitSelectionContext(message)).toEqual({
      context: { text: 'FROM t', startLine: 2, endLine: 2, charCount: 6 },
      text: 'why is this slow?',
    });
  });

  it('leaves a message without a selection untouched', () => {
    expect(withSelectionContext('hello', null)).toBe('hello');
    expect(splitSelectionContext('hello')).toEqual({ context: null, text: 'hello' });
  });
});
