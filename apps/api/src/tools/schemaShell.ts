import { Bash } from 'just-bash';

import { WORKSPACE_DIR, type SchemaFiles } from './schemaWorkspace.js';

/** A search is a handful of greps; anything longer has gone wrong. */
const TIMEOUT_MS = 10_000;

/** Keeps a careless `cat columns.tsv` from eating the context window. */
const MAX_OUTPUT_CHARS = 8_000;

export type BashResult = { output: string } | { error: string };

/**
 * A bash environment holding one connection's schema.
 *
 * just-bash is a simulated shell over an in-memory filesystem: the sub-agent
 * gets the usual tools (grep, awk, cut, find, head) with no host process, no
 * network and no path outside the files it is handed. That replaces the
 * allowlist this used to carry — there is nothing to escape to, so commands
 * need no vetting, and the schema never touches disk.
 *
 * Fresh per search: the sub-agent may write to its copy, and the next search
 * should start from the schema as it is, not as the last one left it.
 */
export function createSchemaShell(files: SchemaFiles): Bash {
  return new Bash({
    files,
    cwd: WORKSPACE_DIR,
    executionLimitProfile: 'hardened',
    executionLimits: { maxExecutionTimeMs: TIMEOUT_MS },
  });
}

/** Runs one command in the schema shell and shapes the result for the model. */
export async function runInShell(
  shell: Bash,
  command: string,
  abortSignal?: AbortSignal,
): Promise<BashResult> {
  try {
    const { stdout, stderr, exitCode } = await shell.exec(command, { signal: abortSignal });

    if (exitCode === 0) {
      return { output: truncate(stdout || stderr || '(no output)') };
    }

    // grep exits 1 on no match, which is an answer rather than a failure.
    if (exitCode === 1 && stderr.trim() === '') {
      return { output: '(no matches)' };
    }

    return { error: truncate(stderr.trim() || `Command failed with exit code ${exitCode}.`) };
  } catch (error) {
    if (abortSignal?.aborted) {
      return { error: 'Stopped.' };
    }

    return { error: error instanceof Error ? error.message : 'Command failed.' };
  }
}

function truncate(text: string): string {
  if (text.length <= MAX_OUTPUT_CHARS) {
    return text;
  }

  return `${text.slice(0, MAX_OUTPUT_CHARS)}\n…truncated at ${MAX_OUTPUT_CHARS} characters; narrow the command.`;
}
