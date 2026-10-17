import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useEditorStore } from '../stores/useEditorStore.js';
import { useQueryStore } from '../stores/useQueryStore.js';
import { runEditor } from './runEditor.js';

/** The statements /query was asked to run, in order. */
const ran = () => fetchSpy.mock.calls.map((call) => JSON.parse(String(call[1]?.body)).query);

let fetchSpy: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchSpy = vi.fn(
    async () => new Response(JSON.stringify({ rows: [], durationMs: 1 }), { status: 200 }),
  );
  vi.stubGlobal('fetch', fetchSpy);

  useEditorStore.setState({ sql: 'SELECT 1', version: 1, selectionStart: 0, selectionEnd: 0 });
  useQueryStore.setState({ history: [], results: [], activeResult: 0, isRunning: false });
});

describe('runEditor', () => {
  it('runs the whole buffer when nothing is selected', async () => {
    useEditorStore.setState({ sql: 'SELECT 1;\nSELECT 2' });

    runEditor();
    await vi.waitFor(() => expect(useQueryStore.getState().isRunning).toBe(false));

    expect(ran()).toEqual(['SELECT 1', 'SELECT 2']);
  });

  it('runs only the selection when there is one', async () => {
    useEditorStore.setState({ sql: 'SELECT 1;\nSELECT 2', selectionStart: 10, selectionEnd: 18 });

    runEditor();
    await vi.waitFor(() => expect(useQueryStore.getState().isRunning).toBe(false));

    expect(ran()).toEqual(['SELECT 2']);
  });

  it('ignores a run while one is already in flight', () => {
    useQueryStore.setState({ isRunning: true });

    runEditor();

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('does nothing when there is nothing to run', () => {
    useEditorStore.setState({ sql: '  \n;' });

    runEditor();

    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
