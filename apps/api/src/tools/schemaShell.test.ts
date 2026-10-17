import { describe, expect, it } from 'vitest';

import { createSchemaShell, runInShell } from './schemaShell.js';
import { WORKSPACE_DIR } from './schemaWorkspace.js';

const files = {
  [`${WORKSPACE_DIR}/tables.tsv`]: [
    '# database\ttable\tengine\trows',
    'northwind\torders\tMergeTree\t830',
    'northwind\tproducts\tMergeTree\t77',
  ].join('\n'),
  [`${WORKSPACE_DIR}/columns.tsv`]: [
    '# database\ttable\tcolumn\ttype\tcomment',
    'northwind\torders\tfreight\tDecimal(10, 2)\tshipping cost',
    'northwind\tproducts\tunit_price\tDecimal(10, 2)\t',
  ].join('\n'),
  [`${WORKSPACE_DIR}/ddl/northwind/orders.sql`]: 'CREATE TABLE northwind.orders (...)',
};

const run = (command: string) => runInShell(createSchemaShell(files), command);

describe('the schema shell', () => {
  it('greps the schema', async () => {
    const result = await run("grep -i 'freight' columns.tsv");

    expect(result).toEqual({
      output: 'northwind\torders\tfreight\tDecimal(10, 2)\tshipping cost\n',
    });
  });

  it('runs a pipeline', async () => {
    const result = await run('cat tables.tsv | grep -v "^#" | cut -f2 | sort');

    expect(result).toEqual({ output: 'orders\nproducts\n' });
  });

  it('keeps a quoted pipe as data rather than a second command', async () => {
    const result = await run("grep -c -E 'freight|unit_price' columns.tsv");

    expect(result).toEqual({ output: '2\n' });
  });

  it('reports no matches as an answer, not a failure', async () => {
    expect(await run('grep nothing-here columns.tsv')).toEqual({ output: '(no matches)' });
  });

  it('reports a command that fails', async () => {
    const result = await run('cat missing.tsv');

    expect(result).toHaveProperty('error', expect.stringContaining('missing.tsv'));
  });

  it('sees only the schema, not the host filesystem', async () => {
    const result = await run('cat /etc/passwd');

    expect(result).toHaveProperty('error');
  });

  it('has no network', async () => {
    const result = await run('curl https://example.com');

    expect(result).toHaveProperty('error');
  });

  it('cannot change the schema another search will read', async () => {
    const shell = createSchemaShell(files);
    await runInShell(shell, 'echo wiped > columns.tsv');

    const fresh = await run('grep -c freight columns.tsv');

    expect(fresh).toEqual({ output: '1\n' });
  });

  it('truncates output that would swamp the model', async () => {
    const wide = { [`${WORKSPACE_DIR}/big.txt`]: 'x'.repeat(20_000) };
    const result = await runInShell(createSchemaShell(wide), 'cat big.txt');

    expect(result).toHaveProperty('output', expect.stringContaining('truncated at 8000'));
  });
});
