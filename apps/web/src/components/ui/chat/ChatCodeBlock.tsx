import { useMemo } from 'react';
import { tokenize } from 'rangi';

type ChatCodeBlockProps = {
  code: string;
  language?: string;
};

/**
 * Markdown code blocks, highlighted with rangi: a ~13kB zero-dependency
 * tokenizer. Tokens are rendered as spans rather than injected as HTML, so
 * model output never reaches `dangerouslySetInnerHTML`.
 */
export function ChatCodeBlock({ code, language = 'sql' }: ChatCodeBlockProps) {
  const lines = useMemo(() => toLines(code, language), [code, language]);

  return (
    <pre className="my-2 overflow-x-auto rounded-md bg-neutral-100 px-2.5 py-2 font-mono">
      <code>
        {lines.map((line, lineIndex) => (
          <span key={lineIndex} className="block">
            {line.map((token, tokenIndex) => (
              <span key={tokenIndex} className={token.type ? `shj-${token.type}` : undefined}>
                {token.text}
              </span>
            ))}
            {line.length === 0 && '\n'}
          </span>
        ))}
      </code>
    </pre>
  );
}

type Token = { text: string; type?: string };

/**
 * A token can span several lines (block comments, strings), so the code is
 * tokenized once and the tokens are split afterwards — splitting the source
 * first would break those constructs.
 */
function toLines(code: string, language: string): Token[][] {
  const lines: Token[][] = [[]];

  for (const token of tokenize(code, { lang: language }) as Token[]) {
    token.text.split('\n').forEach((part, index) => {
      if (index > 0) {
        lines.push([]);
      }

      if (part !== '') {
        lines.at(-1)?.push({ text: part, type: token.type });
      }
    });
  }

  return lines;
}
