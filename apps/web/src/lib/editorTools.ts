import { useEditorStore } from '../stores/useEditorStore.js';
import { useQueryStore, splitStatements } from '../stores/useQueryStore.js';
import { validateStatements, type SqlValidation } from './api.js';

/**
 * The editor-side half of the assistant's tools. The model calls these, the
 * browser executes them, and the result is streamed back as the tool output.
 *
 * Every mutating tool reports the resulting state, so the model always ends a
 * turn knowing what the buffer looks like and which version to quote next.
 */
export type EditorState = {
  /** The buffer with 1-based line numbers, as the model should read it. */
  numberedSql: string;
  lineCount: number;
  cursor: { line: number; column: number; offset: number };
  selection: { text: string; start: number; end: number; isEmpty: boolean };
  dialect: string;
  version: number;
};

export type ToolResult =
  | { ok: true; validation: SqlValidation; state: EditorState }
  | { ok: false; error: string; state: EditorState };

/** ClickHouse is the only dialect today; the field exists for when it is not. */
const DIALECT = 'clickhouse';

export function getEditorState(): EditorState {
  const { sql, version, selectionStart, selectionEnd } = useEditorStore.getState();

  const lines = sql.split('\n');
  const before = sql.slice(0, selectionStart).split('\n');

  return {
    numberedSql: lines.map((line, index) => `${index + 1}\t${line}`).join('\n'),
    lineCount: lines.length,
    cursor: {
      line: before.length,
      column: (before.at(-1)?.length ?? 0) + 1,
      offset: selectionStart,
    },
    selection: {
      text: sql.slice(selectionStart, selectionEnd),
      start: selectionStart,
      end: selectionEnd,
      isEmpty: selectionStart === selectionEnd,
    },
    dialect: DIALECT,
    version,
  };
}

/** Rejects an edit planned against a buffer the user has since changed. */
function checkVersion(version: number): ToolResult | null {
  const current = useEditorStore.getState().version;

  if (version === current) {
    return null;
  }

  return {
    ok: false,
    error:
      `The editor changed since version ${version} (it is now at ${current}), so the edit was not applied. ` +
      `Re-read the buffer below and retry against the current version.`,
    state: getEditorState(),
  };
}

/**
 * Every applied edit is checked against the server before the result goes
 * back, so a broken buffer is reported in the same step that broke it rather
 * than when the user eventually hits Run.
 */
async function applied(): Promise<ToolResult> {
  const validation = await validateStatements(splitStatements(useEditorStore.getState().sql));

  return { ok: true, validation, state: getEditorState() };
}

export async function strReplace(
  oldStr: string,
  newStr: string,
  version: number,
): Promise<ToolResult> {
  const stale = checkVersion(version);

  if (stale) {
    return stale;
  }

  const { sql, setSql } = useEditorStore.getState();
  const first = sql.indexOf(oldStr);

  if (first === -1) {
    return {
      ok: false,
      error:
        'No match for `old_str`. It must match the buffer exactly, including whitespace and line breaks. ' +
        'Read the numbered buffer below and copy the text verbatim.',
      state: getEditorState(),
    };
  }

  if (sql.indexOf(oldStr, first + 1) !== -1) {
    return {
      ok: false,
      error:
        '`old_str` matches more than once, so the edit is ambiguous. ' +
        'Extend it with surrounding lines until it identifies a single place.',
      state: getEditorState(),
    };
  }

  setSql(sql.slice(0, first) + newStr + sql.slice(first + oldStr.length));

  return applied();
}

export async function replaceSelection(text: string, version: number): Promise<ToolResult> {
  const stale = checkVersion(version);

  if (stale) {
    return stale;
  }

  const { sql, selectionStart, selectionEnd, setSql } = useEditorStore.getState();

  if (selectionStart === selectionEnd) {
    return {
      ok: false,
      error: 'Nothing is selected. Use insert_at_cursor or str_replace instead.',
      state: getEditorState(),
    };
  }

  setSql(sql.slice(0, selectionStart) + text + sql.slice(selectionEnd));

  return applied();
}

export async function insertAtCursor(text: string, version: number): Promise<ToolResult> {
  const stale = checkVersion(version);

  if (stale) {
    return stale;
  }

  const { sql, selectionStart, setSql } = useEditorStore.getState();
  setSql(sql.slice(0, selectionStart) + text + sql.slice(selectionStart));

  return applied();
}

export async function setQuery(sql: string, version: number): Promise<ToolResult> {
  const stale = checkVersion(version);

  if (stale) {
    return stale;
  }

  useEditorStore.getState().setSql(sql);

  return applied();
}

export type LastError =
  { hasError: false } | { hasError: true; error: string; sql: string; executedAt: string };

/**
 * The most recent failed execution, so the model can diagnose without the user
 * pasting the message. Reads the history rather than the live error field: the
 * history entry also carries the statement that produced it.
 */
export function getLastError(): LastError {
  const { history, error } = useQueryStore.getState();
  const failed = history.find((entry) => entry.status === 'error');

  if (failed?.error) {
    return {
      hasError: true,
      error: failed.error,
      sql: failed.sql,
      executedAt: new Date(failed.executedAt).toISOString(),
    };
  }

  if (error) {
    return { hasError: true, error, sql: useEditorStore.getState().sql, executedAt: '' };
  }

  return { hasError: false };
}

/** The buffer before and after an edit, without applying it. */
export type EditPreview = { before: string; after: string };

/**
 * Computes what an edit would do, so the change can be shown (and approved)
 * before it touches the buffer. Returns `null` for non-editing tools.
 */
export function previewEdit(name: string, input: unknown): EditPreview | null {
  const args = (input ?? {}) as Record<string, unknown>;
  const { sql, selectionStart, selectionEnd } = useEditorStore.getState();

  switch (name) {
    case 'str_replace': {
      const oldStr = String(args.old_str ?? '');
      const index = sql.indexOf(oldStr);

      if (oldStr === '' || index === -1) {
        return null;
      }

      return {
        before: sql,
        after: sql.slice(0, index) + String(args.new_str ?? '') + sql.slice(index + oldStr.length),
      };
    }
    case 'replace_selection':
      return {
        before: sql,
        after: sql.slice(0, selectionStart) + String(args.text ?? '') + sql.slice(selectionEnd),
      };
    case 'insert_at_cursor':
      return {
        before: sql,
        after: sql.slice(0, selectionStart) + String(args.text ?? '') + sql.slice(selectionStart),
      };
    case 'set_query':
      return { before: sql, after: String(args.sql ?? '') };
    default:
      return null;
  }
}

/** Editing tools, as opposed to the read-only `get_editor_state`. */
export const EDIT_TOOL_NAMES = [
  'str_replace',
  'replace_selection',
  'insert_at_cursor',
  'set_query',
];

export function isEditTool(name: string): boolean {
  return EDIT_TOOL_NAMES.includes(name);
}

/** The result handed back when the user declines an edit. */
export function rejectedByUser(): ToolResult {
  return {
    ok: false,
    error: 'The user rejected this edit. Ask what they would like changed instead of retrying.',
    state: getEditorState(),
  };
}

/**
 * Dispatches a tool call from the model to its implementation. Returns
 * `undefined` for tools the server executes, which the browser must ignore.
 */
export function runEditorTool(
  name: string,
  input: unknown,
): Promise<ToolResult> | EditorState | LastError | undefined {
  const args = (input ?? {}) as Record<string, unknown>;
  const version = Number(args.version);

  switch (name) {
    case 'get_editor_state':
      return getEditorState();
    case 'get_last_error':
      return getLastError();
    case 'str_replace':
      return strReplace(String(args.old_str ?? ''), String(args.new_str ?? ''), version);
    case 'replace_selection':
      return replaceSelection(String(args.text ?? ''), version);
    case 'insert_at_cursor':
      return insertAtCursor(String(args.text ?? ''), version);
    case 'set_query':
      return setQuery(String(args.sql ?? ''), version);
    default:
      return undefined;
  }
}
