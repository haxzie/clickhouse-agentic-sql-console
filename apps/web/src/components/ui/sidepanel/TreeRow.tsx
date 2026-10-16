import { ChevronDown, ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';

type TreeRowProps = {
  depth: number;
  icon: ReactNode;
  label: string;
  hint?: string;
  isExpandable?: boolean;
  isExpanded?: boolean;
  onClick?: () => void;
};

/** One row of the schema tree; indentation is driven by `depth`. */
export function TreeRow({
  depth,
  icon,
  label,
  hint,
  isExpandable = false,
  isExpanded = false,
  onClick,
}: TreeRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ paddingLeft: `${depth * 12 + 8}px` }}
      aria-expanded={isExpandable ? isExpanded : undefined}
      className="flex w-full cursor-pointer items-center gap-1.5 py-1 pr-2 text-left text-neutral-700 hover:bg-neutral-200/60"
    >
      <span className="flex w-3 shrink-0 justify-center text-neutral-400">
        {isExpandable && (isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />)}
      </span>
      <span className="shrink-0 text-neutral-400">{icon}</span>
      <span className="truncate">{label}</span>
      {hint && <span className="text-sub ml-auto shrink-0 pl-2 text-neutral-400">{hint}</span>}
    </button>
  );
}
