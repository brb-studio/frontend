"use client";

import { X } from "lucide-react";
import {
  createContext,
  type PointerEvent,
  type ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

/** Dragging the header down past this many pixels (or flicking it) closes the sheet. */
const DISMISS_DISTANCE = 120;
const DISMISS_VELOCITY = 0.6;

const FooterSlot = createContext<HTMLElement | null>(null);

/**
 * The sheet's action buttons: pinned to its bottom edge (above the iPhone home indicator) while the
 * content scrolls. Outside a sheet they render in place. Submit buttons moved here leave their
 * `<form>` in the DOM, so they need the `form` attribute.
 */
export function SheetActions({ children }: { children: ReactNode }) {
  const slot = useContext(FooterSlot);
  return slot ? createPortal(children, slot) : children;
}

/**
 * A bottom sheet over the page (full width on phones, centered card on desktop), closed with Esc, the
 * X, the backdrop, or (on phones) dragging it down. It grows with its content up to 90% of the screen.
 */
export function Sheet({
  open,
  onClose,
  title,
  icon,
  aside,
  closeLabel,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  icon?: ReactNode;
  aside?: ReactNode;
  closeLabel: string;
  children: ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  // Two frames after mounting (once the closed position has painted), so a sheet that starts open still slides in.
  const [settled, setSettled] = useState(false);
  const [footer, setFooter] = useState<HTMLDivElement | null>(null);
  const [drag, setDrag] = useState<number | null>(null);
  const start = useRef({ y: 0, time: 0 });
  useEffect(() => {
    setMounted(true);
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => setSettled(true));
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  const shown = open && settled;

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", close);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", close);
    };
  }, [open, onClose]);

  function grab(event: PointerEvent<HTMLElement>) {
    if (window.matchMedia("(min-width: 48rem)").matches) return;
    if ((event.target as HTMLElement).closest("button, a")) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    start.current = { y: event.clientY, time: event.timeStamp };
    setDrag(0);
  }
  function move(event: PointerEvent<HTMLElement>) {
    if (drag === null) return;
    setDrag(Math.max(0, event.clientY - start.current.y));
  }
  function release(event: PointerEvent<HTMLElement>) {
    if (drag === null) return;
    const elapsed = Math.max(1, event.timeStamp - start.current.time);
    if (drag > DISMISS_DISTANCE || drag / elapsed > DISMISS_VELOCITY) {
      onClose();
    }
    setDrag(null);
  }

  if (!mounted) return null;
  return createPortal(
    <div
      inert={!open}
      className="fixed inset-0 z-50 flex flex-col justify-end md:items-center md:justify-center"
    >
      <button
        type="button"
        aria-label={closeLabel}
        onClick={onClose}
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-500 ${shown ? "opacity-100" : "opacity-0"}`}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-sheet-title"
        style={drag ? { translate: `0 ${drag}px` } : undefined}
        className={`relative flex max-h-[90dvh] w-full flex-col rounded-t-[2rem] border border-b-0 border-line bg-sheet text-fg shadow-soft backdrop-blur-2xl md:max-w-lg md:rounded-[2rem] md:border-b ${drag === null ? "transition-[translate,opacity] duration-500 ease-spring" : ""} ${shown ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 md:translate-y-8"}`}
      >
        <header
          onPointerDown={grab}
          onPointerMove={move}
          onPointerUp={release}
          onPointerCancel={() => setDrag(null)}
          className="shrink-0 touch-none px-5 pt-3 select-none md:touch-auto md:select-auto"
        >
          <span
            aria-hidden="true"
            className="mx-auto mb-3 block h-1.5 w-10 rounded-full bg-fg/20 md:hidden"
          />
          <div className="flex items-center justify-between gap-3 border-b border-line pb-3">
            <p className="flex min-w-0 items-center gap-2 text-base font-medium">
              {icon}
              <span id="payment-sheet-title" className="truncate">
                {title}
              </span>
            </p>
            <p className="flex shrink-0 items-center gap-3">
              {aside}
              <button
                type="button"
                onClick={onClose}
                aria-label={closeLabel}
                className="grid size-10 place-items-center rounded-full border border-line bg-surface transition-colors hover:border-accent"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </p>
          </div>
        </header>
        <div className="min-h-0 flex-1 overscroll-contain overflow-y-auto px-5 pt-4 pb-4 [&:has(+div:empty)]:pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <FooterSlot.Provider value={footer}>
            {open && children}
          </FooterSlot.Provider>
        </div>
        <div
          ref={setFooter}
          className="flex shrink-0 flex-col gap-2 border-t border-line px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] empty:hidden"
        />
      </div>
    </div>,
    document.body,
  );
}
