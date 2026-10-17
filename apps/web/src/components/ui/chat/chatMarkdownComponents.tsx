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
