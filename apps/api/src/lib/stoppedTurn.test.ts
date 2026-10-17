import { describe, expect, it } from 'vitest';
import type { UIMessage } from 'ai';

import { closeStoppedToolCalls } from './stoppedTurn.js';

const user = (text: string): UIMessage => ({
  id: 'u1',
  role: 'user',
  parts: [{ type: 'text', text }],
});

const assistant = (parts: unknown[]): UIMessage =>
  ({ id: 'a1', role: 'assistant', parts }) as UIMessage;

describe('closeStoppedToolCalls', () => {
  it('gives an unfinished tool call an outcome', () => {
    const [, message] = closeStoppedToolCalls([
      user('find the orders table'),
      assistant([{ type: 'tool-search', toolCallId: 't1', state: 'input-available', input: {} }]),
    ]);

    expect(message.parts[0]).toMatchObject({
      state: 'output-error',
      errorText: 'Stopped by the user before it finished.',
    });
  });

  it('closes a call whose input was still streaming', () => {
    const [, message] = closeStoppedToolCalls([
      user('run it'),
      assistant([{ type: 'tool-run_query', toolCallId: 't1', state: 'input-streaming' }]),
    ]);

    expect(message.parts[0]).toMatchObject({ state: 'output-error' });
  });

  it('leaves a finished call alone', () => {
    const output = { matches: [] };
    const [, message] = closeStoppedToolCalls([
      user('find it'),
      assistant([{ type: 'tool-search', toolCallId: 't1', state: 'output-available', output }]),
    ]);

    expect(message.parts[0]).toMatchObject({ state: 'output-available', output });
  });

  it('drops an assistant message that never said anything', () => {
    const messages = closeStoppedToolCalls([
      user('hello'),
      assistant([{ type: 'step-start' }, { type: 'text', text: '  ' }]),
    ]);

    expect(messages).toHaveLength(1);
    expect(messages[0].role).toBe('user');
  });

  it('keeps a partial reply', () => {
    const messages = closeStoppedToolCalls([
      user('hello'),
      assistant([{ type: 'step-start' }, { type: 'text', text: 'The orders table' }]),
    ]);

    expect(messages).toHaveLength(2);
  });

  it('leaves user messages untouched', () => {
    const messages = [user('hello')];

    expect(closeStoppedToolCalls(messages)).toEqual(messages);
  });
});
