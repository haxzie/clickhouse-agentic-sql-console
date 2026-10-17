import { useQueryStore } from '../../../stores/useQueryStore.js';

type Indicator = {
  dotClass: string;
  label: string;
};

/** Dot + label describing the last (or in-flight) execution. */
export function QueryStatusIndicator() {
  const isRunning = useQueryStore((state) => state.isRunning);
  const error = useQueryStore((state) => state.results[state.activeResult]?.error ?? null);
  const durationMs = useQueryStore(
    (state) => state.results[state.activeResult]?.durationMs ?? null,
  );

  const indicator = resolveIndicator({ isRunning, error, durationMs });

  if (!indicator) {
    return null;
  }

  return (
    <output className="flex items-center gap-1.5 text-neutral-500">
      <span className={`size-1.5 shrink-0 rounded-full ${indicator.dotClass}`} />
      {indicator.label}
    </output>
  );
}

function resolveIndicator({
  isRunning,
  error,
  durationMs,
}: {
  isRunning: boolean;
  error: string | null;
  durationMs: number | null;
}): Indicator | null {
  if (isRunning) {
    return { dotClass: 'bg-amber-400', label: 'Running…' };
  }

  if (error) {
    return { dotClass: 'bg-red-500', label: 'Error' };
  }

  if (durationMs !== null) {
    return { dotClass: 'bg-emerald-500', label: `Completed in ${formatDuration(durationMs)}` };
  }

  return null;
}

function formatDuration(durationMs: number): string {
  return durationMs < 1000 ? `${durationMs} ms` : `${(durationMs / 1000).toFixed(2)} s`;
}
