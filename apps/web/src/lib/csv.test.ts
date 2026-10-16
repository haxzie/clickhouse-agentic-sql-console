import { describe, expect, it } from 'vitest';

import { toCsv } from './csv.js';

describe('toCsv', () => {
  it('writes a header row followed by the data', () => {
    const csv = toCsv([
      { id: 1, name: 'event_1' },
      { id: 2, name: 'event_2' },
    ]);

    expect(csv).toBe('id,name\n1,event_1\n2,event_2');
  });

  it('returns an empty string with no rows', () => {
    expect(toCsv([])).toBe('');
  });

  it('quotes values containing a comma, quote or newline', () => {
    const csv = toCsv([{ a: 'x,y', b: 'say "hi"', c: 'line1\nline2' }]);

    expect(csv).toBe('a,b,c\n"x,y","say ""hi""","line1\nline2"');
  });

  it('renders nested values as JSON and nullish values as empty', () => {
    const csv = toCsv([{ nested: { k: 1 }, missing: null, undef: undefined }]);

    expect(csv).toBe('nested,missing,undef\n"{""k"":1}",,');
  });
});
