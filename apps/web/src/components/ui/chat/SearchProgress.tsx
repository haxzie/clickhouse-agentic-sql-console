import { Terminal, Table2 } from 'lucide-react';

export type SearchStep = { tool: 'bash' | 'run_sql'; detail: string };

type SearchProgressProps = {
  steps: SearchStep[];
};

/** What the schema-search sub-agent is doing, streamed while it works. */
export function SearchProgress({ steps }: SearchProgressProps) {
  if (steps.length === 0) {
    return null;
  }

  return (
    <ol className="text-sub ml-[18px] flex flex-col gap-0.5 border-l border-neutral-200 pl-2.5 text-neutral-400">
      {steps.map((step, index) => (
        <li key={index} className="flex items-center gap-1.5">
          <span className="shrink-0">
            {step.tool === 'bash' ? <Terminal size={11} /> : <Table2 size={11} />}
          </span>
          <code className="truncate font-mono">{step.detail}</code>
        </li>
      ))}
    </ol>
  );
}
