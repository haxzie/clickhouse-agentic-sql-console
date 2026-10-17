import { describe, expect, it } from 'vitest';

import { runInSandbox, validateCommand } from './sandboxBash.js';

describe('validateCommand', () => {
  it('allows read-only inspection commands', () => {
    expect(validateCommand('grep -i amount columns.tsv')).toBeNull();
    expect(validateCommand('cat tables.tsv | head -20')).toBeNull();
    expect(validateCommand('find ddl -name "*.sql"')).toBeNull();
  });

  it.each([
    ['rm -rf /', '`rm` is not available'],
    ['curl http://example.com', '`curl` is not available'],
    ['xargs rm', '`xargs` is not available'],
    ['node -e "process.exit()"', '`node` is not available'],
  ])('rejects %s', (command, expected) => {
    expect(validateCommand(command)).toContain(expected);
  });

  it.each([
    ['cat a > b', 'redirection'],
    ['cat < a', 'redirection'],
    ['echo `whoami`', 'command substitution'],
    ['echo $(whoami)', 'command substitution'],
    ['ls && rm -rf .', '`&`'],
    ['ls; rm -rf .', 'command sequencing'],
    ['echo "$(whoami)"', 'command substitution'],
  ])('rejects shell escape %s', (command, expected) => {
    expect(validateCommand(command)).toContain(expected);
  });

  // A pipe inside quotes is data, not a second command: regex alternation is
  // how the agent searches for synonyms, so rejecting it would break search.
  it('treats quoted pipes and redirects as data', () => {
    expect(validateCommand("grep -i -E 'amount|price|revenue' columns.tsv")).toBeNull();
    expect(validateCommand("awk -F'\\t' '$3 > 5' columns.tsv")).toBeNull();
    expect(validateCommand(`grep '>' columns.tsv`)).toBeNull();
  });

  it('still splits real pipelines outside quotes', () => {
    expect(validateCommand("grep -E 'a|b' columns.tsv | rm -rf .")).toContain('not available');
  });

  it('rejects an unbalanced quote', () => {
    expect(validateCommand(`grep 'amount columns.tsv`)).toContain('unbalanced quote');
  });

  it('rejects a binary given by path', () => {
    expect(validateCommand('/bin/rm -rf .')).toContain('by name, not by path');
  });

  it('checks every segment of a pipeline', () => {
    expect(validateCommand('cat tables.tsv | rm -rf .')).toContain('`rm` is not available');
  });
});

describe('runInSandbox', () => {
  it('runs an allowed command in the given directory', async () => {
    const result = await runInSandbox('echo hello', process.cwd());

    expect(result).toEqual({ output: 'hello\n' });
  });

  it('refuses a rejected command without running it', async () => {
    const result = await runInSandbox('rm -rf .', process.cwd());

    expect(result).toHaveProperty('error', expect.stringContaining('not available'));
  });

  it('reports no matches rather than failing', async () => {
    const result = await runInSandbox('grep zzzz-not-here package.json', process.cwd());

    expect(result).toEqual({ output: '(no matches)' });
  });
});
