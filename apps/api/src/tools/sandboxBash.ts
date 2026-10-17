import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const run = promisify(execFile);

/**
 * Read-only inspection commands. Anything that writes, fetches or spawns
 * arbitrary programs (xargs, curl, node, sh) is absent by design.
 */
const ALLOWED = new Set([
  'ls',
  'cat',
  'head',
  'tail',
  'grep',
  'egrep',
  'fgrep',
  'find',
  'wc',
  'sort',
  'uniq',
  'cut',
  'tr',
  'awk',
  'sed',
  'echo',
  'basename',
  'dirname',
  'column',
  'nl',
]);

const TIMEOUT_MS = 10_000;
const MAX_BUFFER = 512 * 1024;
/** Keeps a careless `cat columns.tsv` from eating the context window. */
const MAX_OUTPUT_CHARS = 8_000;

export type BashResult = { output: string } | { error: string };

/**
 * Validates a command against the allowlist. Exported for tests: this is the
 * boundary that keeps a model (or anything injected into the schema it reads)
 * from running something it shouldn't.
 */
export function validateCommand(command: string): string | null {
  const trimmed = command.trim();

  if (trimmed === '') {
    return 'Empty command.';
  }

  const segments = splitPipeline(trimmed);

  if ('error' in segments) {
    return segments.error;
  }

  for (const segment of segments.parts) {
    const binary = segment.trim().split(/\s+/)[0];

    if (binary === undefined || binary === '') {
      return 'Rejected: empty pipeline segment.';
    }

    if (binary.includes('/')) {
      return `Rejected: run \`${binary.split('/').pop()}\` by name, not by path.`;
    }

    if (!ALLOWED.has(binary)) {
      return `Rejected: \`${binary}\` is not available. Allowed: ${[...ALLOWED].sort().join(', ')}.`;
    }
  }

  return null;
}

/**
 * Splits on pipes, honouring quotes, and rejects shell syntax that could
 * escape the allowlist.
 *
 * Quote awareness is the point: `grep -E 'amount|price'` is an ordinary
 * command whose pipe is data, while `cat x | rm -rf .` is two commands. The
 * same distinction applies to redirection, which is literal inside quotes.
 */
function splitPipeline(command: string): { parts: string[] } | { error: string } {
  const parts: string[] = [];
  let current = '';
  let quote: "'" | '"' | null = null;

  for (let index = 0; index < command.length; index += 1) {
    const char = command[index];
    const next = command[index + 1];

    if (quote) {
      if (char === quote) {
        quote = null;
      } else if (quote === '"' && (char === '`' || (char === '$' && next === '('))) {
        return { error: 'Rejected: command substitution is not allowed.' };
      }

      current += char;
      continue;
    }

    if (char === "'" || char === '"') {
      quote = char;
      current += char;
      continue;
    }

    if (char === '`' || (char === '$' && next === '(')) {
      return { error: 'Rejected: command substitution is not allowed.' };
    }

    if (char === '>' || char === '<') {
      return { error: 'Rejected: redirection is not allowed; the workspace is read-only.' };
    }

    if (char === '&') {
      return { error: 'Rejected: `&` and `&&` are not allowed. Use a single pipeline.' };
    }

    if (char === ';') {
      return { error: 'Rejected: command sequencing is not allowed. Use a single pipeline.' };
    }

    if (char === '\n') {
      return { error: 'Rejected: one command per call.' };
    }

    if (char === '|') {
      parts.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  if (quote) {
    return { error: 'Rejected: unbalanced quote.' };
  }

  parts.push(current);

  return { parts };
}

/** Runs a validated command inside the schema workspace. */
export async function runInSandbox(command: string, cwd: string): Promise<BashResult> {
  const rejection = validateCommand(command);

  if (rejection) {
    return { error: rejection };
  }

  try {
    const { stdout, stderr } = await run('bash', ['-c', command], {
      cwd,
      timeout: TIMEOUT_MS,
      maxBuffer: MAX_BUFFER,
      // No inherited environment: nothing here needs the API process's secrets.
      env: { PATH: '/usr/bin:/bin:/usr/local/bin', LANG: 'C' },
    });

    return { output: truncate(stdout || stderr || '(no output)') };
  } catch (error) {
    const failure = error as { stdout?: string; stderr?: string; killed?: boolean; code?: number };

    if (failure.killed) {
      return { error: `Timed out after ${TIMEOUT_MS / 1000}s. Narrow the command.` };
    }

    // grep exits 1 on no match, which is an answer rather than a failure.
    if (failure.code === 1 && !failure.stderr) {
      return { output: '(no matches)' };
    }

    return { error: truncate(failure.stderr || `Command failed with code ${failure.code}.`) };
  }
}

function truncate(text: string): string {
  if (text.length <= MAX_OUTPUT_CHARS) {
    return text;
  }

  return `${text.slice(0, MAX_OUTPUT_CHARS)}\n…truncated at ${MAX_OUTPUT_CHARS} characters; narrow the command.`;
}
