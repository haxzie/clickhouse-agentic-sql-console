import type { ReactNode } from 'react';

type PanelHeadingProps = {
  children: ReactNode;
};

/** Small uppercase section heading used at the top of each panel. */
export function PanelHeading({ children }: PanelHeadingProps) {
  return (
    <h2 className="text-sub flex items-center gap-1.5 font-medium tracking-wide text-neutral-400 uppercase">
      {children}
    </h2>
  );
}
