import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';

/** How far an arrow key moves the boundary. */
const KEY_STEP = 24;

/** Which edge of the panel the handle sits on. */
type Edge = 'top' | 'left';

type ResizeHandleProps = {
  edge: Edge;
  /** The panel's size along the dragged axis when the drag starts. */
  sizeAtStart: () => number;
  /** Called with the size the panel should take, as the pointer moves. */
  onResize: (size: number) => void;
  label: string;
};

const STYLES: Record<Edge, { strip: string; line: string; grow: string; shrink: string }> = {
  top: {
    strip: '-top-2 inset-x-0 h-4 cursor-row-resize items-center',
    line: 'h-0.5 w-full',
    grow: 'ArrowUp',
    shrink: 'ArrowDown',
  },
  left: {
    strip: '-left-2 inset-y-0 w-4 cursor-col-resize justify-center',
    line: 'w-0.5 h-full',
    grow: 'ArrowLeft',
    shrink: 'ArrowRight',
  },
};

/**
 * The boundary between two panels, dragged to resize the one it belongs to.
 *
 * It sits on the border rather than beside it: the strip is thicker than the
 * line it draws and is pulled back by half its thickness, so there is room to
 * catch the pointer without the layout gaining a row or a column. Dragging
 * away from the panel grows it, which is the direction the hand expects.
 */
export function ResizeHandle({ edge, sizeAtStart, onResize, label }: ResizeHandleProps) {
  const [isDragging, setIsDragging] = useState(false);
  const drag = useRef<{ from: number; size: number } | null>(null);
  const style = STYLES[edge];

  const positionOf = (event: PointerEvent<HTMLDivElement>) =>
    edge === 'top' ? event.clientY : event.clientX;

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    // Stops the drag from selecting text in the panels either side.
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);

    drag.current = { from: positionOf(event), size: sizeAtStart() };
    setIsDragging(true);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag.current) {
      return;
    }

    onResize(drag.current.size - (positionOf(event) - drag.current.from));
  };

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    drag.current = null;
    setIsDragging(false);
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== style.grow && event.key !== style.shrink) {
      return;
    }

    event.preventDefault();
    onResize(sizeAtStart() + (event.key === style.grow ? KEY_STEP : -KEY_STEP));
  };

  return (
    <div
      role="separator"
      aria-orientation={edge === 'top' ? 'horizontal' : 'vertical'}
      aria-label={label}
      tabIndex={0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={onKeyDown}
      className={`group absolute z-10 flex touch-none focus:outline-none ${style.strip}`}
    >
      <span
        className={`transition-colors ${style.line} ${
          isDragging
            ? 'bg-blue-500'
            : 'bg-transparent group-hover:bg-blue-500 group-focus-visible:bg-blue-500'
        }`}
      />
    </div>
  );
}
