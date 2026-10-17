import { useUiStore } from '../../../stores/useUiStore.js';

/** Switches result cells between wrapping and single-line with an ellipsis. */
export function WrapTextToggle() {
  const wrapResultText = useUiStore((state) => state.wrapResultText);
  const setWrapResultText = useUiStore((state) => state.setWrapResultText);

  return (
    <label className="flex cursor-pointer items-center gap-1.5 select-none">
      <input
        type="checkbox"
        checked={wrapResultText}
        onChange={(event) => setWrapResultText(event.target.checked)}
        className="cursor-pointer accent-neutral-900"
      />
      Wrap text
    </label>
  );
}
