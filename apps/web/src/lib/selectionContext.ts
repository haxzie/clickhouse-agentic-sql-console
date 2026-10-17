export type SelectionContext = {
  text: string;
  /** 1-based, inclusive. */
  startLine: number;
  endLine: number;
  charCount: number;
};

/**
 * Marks the context block so it can be rendered as a pill rather than raw
 * text. The line range is carried in the tag: it tells the model where the
 * selection sits in the buffer, and lets the transcript relabel the pill.
 */
const CLOSE = '</selected-sql>';
const OPEN_PATTERN = /^<selected-sql lines="(\d+)-(\d+)">/;

/** Describes the editor's current selection, or null when nothing is selected. */
export function describeSelection(state: {
  sql: string;
  selectionStart: number;
  selectionEnd: number;
}): SelectionContext | null {
  const { sql, selectionStart, selectionEnd } = state;
  const start = Math.min(selectionStart, selectionEnd);
  const end = Math.max(selectionStart, selectionEnd);
  const text = sql.slice(start, end);

  if (text.trim() === '') {
    return null;
  }

  const startLine = sql.slice(0, start).split('\n').length;

  return {
    text,
    startLine,
    endLine: startLine + text.split('\n').length - 1,
    charCount: text.length,
  };
}

/**
 * Context for a statement that is not the current selection — a failing query
 * from the results panel, say. Its line range is found by locating it in the
 * buffer; a statement that is no longer there is numbered from its own start.
 */
export function contextForStatement(buffer: string, statement: string): SelectionContext {
  const index = buffer.indexOf(statement);
  const startLine = index === -1 ? 1 : buffer.slice(0, index).split('\n').length;

  return {
    text: statement,
    startLine,
    endLine: startLine + statement.split('\n').length - 1,
    charCount: statement.length,
  };
}

/** Short label for the pill, e.g. "Lines 3-5 selected · 128 chars". */
export function selectionLabel(selection: SelectionContext): string {
  const lines =
    selection.startLine === selection.endLine
      ? `Line ${selection.startLine}`
      : `Lines ${selection.startLine}-${selection.endLine}`;

  return `${lines} selected · ${selection.charCount} chars`;
}

/**
 * Attaches the selection to the outgoing message.
 *
 * It travels inside the message rather than alongside the request so it stays
 * in the conversation: the model's later steps and any follow-up question can
 * still see what the user had highlighted.
 */
export function withSelectionContext(text: string, selection: SelectionContext | null): string {
  if (!selection) {
    return text;
  }

  const tag = `<selected-sql lines="${selection.startLine}-${selection.endLine}">`;

  return `${tag}\n${selection.text}\n${CLOSE}\n\n${text}`;
}

/** Splits a sent message back into its selection context and the typed text. */
export function splitSelectionContext(message: string): {
  context: SelectionContext | null;
  text: string;
} {
  const open = OPEN_PATTERN.exec(message);
  const end = message.indexOf(CLOSE);

  if (!open || end === -1) {
    return { context: null, text: message };
  }

  const selected = message.slice(open[0].length, end).trim();

  return {
    context: {
      text: selected,
      startLine: Number(open[1]),
      endLine: Number(open[2]),
      charCount: selected.length,
    },
    text: message.slice(end + CLOSE.length).trim(),
  };
}
