import type { ComponentProps, ReactNode } from 'react';

import { ChatCodeBlock } from './ChatCodeBlock.js';

/** Pulls the raw text out of a markdown code node's children. */
function textOf(children: ReactNode): string {
  if (typeof children === 'string') {
    return children;
  }

  if (Array.isArray(children)) {
    return children.map(textOf).join('');
  }

  return '';
}

/**
 * Streamdown's stock code block adds a toolbar, line numbers and nested
 * borders. These replace it with a flat CodeMirror block, and leave inline
 * code as plain markup.
 */
export const chatMarkdownComponents = {
  /*
   * Streamdown wraps tables in a card with a copy/download/expand toolbar and
   * nested borders, which is louder than anything else in the panel. These
   * render a plain table in the console's own style; the assistant is told not
   * to repeat query results anyway, so tables here are small by definition.
   */
  table: ({ children }: ComponentProps<'table'>) => (
    <div className="my-2 overflow-x-auto">
      <table className="w-full border-collapse text-left">{children}</table>
    </div>
  ),

  th: ({ children }: ComponentProps<'th'>) => (
    <th className="text-sub border-b border-neutral-200 px-2 py-1 font-medium tracking-wide text-neutral-500 uppercase">
      {children}
    </th>
  ),

  td: ({ children }: ComponentProps<'td'>) => (
    <td className="border-b border-neutral-100 px-2 py-1 align-top">{children}</td>
  ),

  // The <pre> wrapper is dropped; the code element renders the block itself.
  pre: ({ children }: ComponentProps<'pre'>) => <>{children}</>,

  code: ({ className, children, ...props }: ComponentProps<'code'>) => {
    const isBlock = typeof className === 'string' && className.includes('language-');

    if (!isBlock) {
      return (
        <code className="rounded bg-neutral-100 px-1 py-0.5" {...props}>
          {children}
        </code>
      );
    }

    const language = className.match(/language-(\w+)/)?.[1];

    return <ChatCodeBlock code={textOf(children).replace(/\n$/, '')} language={language} />;
  },
};
