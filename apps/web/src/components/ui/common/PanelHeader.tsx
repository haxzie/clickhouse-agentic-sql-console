import type { ReactNode } from 'react';

type PanelHeaderProps = {
  children: ReactNode;
  /** Drops the horizontal padding when the content supplies its own. */
  flush?: boolean;
  className?: string;
};

/**
 * The header strip at the top of every panel. Shared so all sections keep
 * an identical height.
 */
export function PanelHeader({ children, flush = false, className = '' }: PanelHeaderProps) {
  return (
    <header
      className={`flex h-12 shrink-0 items-center justify-between border-b border-neutral-200 ${
        flush ? '' : 'px-3'
      } ${className}`}
    >
      {children}
    </header>
  );
}
