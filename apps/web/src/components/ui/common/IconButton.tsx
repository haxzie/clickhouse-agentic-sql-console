import type { ReactNode } from 'react';

type IconButtonProps = {
  /** Used for both the tooltip and the accessible name. */
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
};

export function IconButton({ label, onClick, disabled = false, children }: IconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className="flex size-7 cursor-pointer items-center justify-center rounded text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-neutral-500"
    >
      {children}
    </button>
  );
}
