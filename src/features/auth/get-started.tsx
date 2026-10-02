"use client";

import { ChevronRight, Scissors } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  useRef,
  useState,
} from "react";

const chevronDelays = [
  "[animation-delay:0ms]",
  "[animation-delay:150ms]",
  "[animation-delay:300ms]",
];

const THRESHOLD = 0.7;
const SLOP = 6;
const SETTLE_MS = 700;

type Props = {
  label: string;
  sheetId: string;
  href: string;
};

export function GetStarted({ label, sheetId, href }: Props) {
  const router = useRouter();
  const trackRef = useRef<HTMLButtonElement>(null);
  const knobRef = useRef<HTMLSpanElement>(null);
  const fillRef = useRef<HTMLSpanElement>(null);
  const contentRef = useRef<HTMLSpanElement>(null);
  const drag = useRef({ x: 0, max: 0, progress: 0, moved: false });
  const [dragging, setDragging] = useState(false);

  const track = () => {
    const button = trackRef.current;
    const knob = knobRef.current;
    if (!button || !knob) return 0;
    return Math.max(
      0,
      button.clientWidth - knob.offsetWidth - knob.offsetLeft * 2,
    );
  };

  const paint = (progress: number, max: number) => {
    const knob = knobRef.current;
    const fill = fillRef.current;
    const content = contentRef.current;
    if (knob) knob.style.transform = `translate3d(${progress * max}px, 0, 0)`;
    if (fill) fill.style.width = `${progress * 100}%`;
    if (content) content.style.opacity = String(1 - progress);
  };

  const settle = (progress: number, max: number) =>
    requestAnimationFrame(() => paint(progress, max));

  const onPointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    drag.current = {
      x: event.clientX,
      max: track(),
      progress: 0,
      moved: false,
    };
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const { x, max } = drag.current;
    const dx = event.clientX - x;
    if (!drag.current.moved && Math.abs(dx) <= SLOP) return;
    drag.current.moved = true;
    const progress = max > 0 ? Math.min(Math.max(dx / max, 0), 1) : 0;
    drag.current.progress = progress;
    paint(progress, max);
  };

  const release = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const isDesktop = () => window.matchMedia("(min-width: 48rem)").matches;

  const openSheet = () => {
    if (isDesktop()) {
      router.push(href);
      return;
    }
    const sheet = document.getElementById(sheetId) as
      | (HTMLElement & { showPopover?: () => void })
      | null;
    if (sheet?.showPopover && !sheet.matches(":popover-open"))
      sheet.showPopover();
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLButtonElement>) => {
    release(event);
    const { max, progress, moved } = drag.current;
    setDragging(false);
    if (!moved) return;
    if (progress < THRESHOLD) {
      settle(0, max);
      return;
    }
    settle(1, max);
    openSheet();
    window.setTimeout(() => settle(0, track()), SETTLE_MS);
  };

  const onPointerCancel = (event: ReactPointerEvent<HTMLButtonElement>) => {
    release(event);
    setDragging(false);
    if (drag.current.moved) settle(0, drag.current.max);
  };

  const onClick = (event: ReactMouseEvent<HTMLButtonElement>) => {
    if (!drag.current.moved) {
      if (isDesktop()) {
        event.preventDefault();
        router.push(href);
      }
      return;
    }
    event.preventDefault();
    drag.current.moved = false;
  };

  const smooth = "duration-500 ease-out-expo";

  return (
    <button
      ref={trackRef}
      type="button"
      popoverTarget={sheetId}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onClick={onClick}
      className="group relative mt-6 flex h-18 animate-rise touch-pan-y select-none items-center gap-4 overflow-hidden rounded-full border border-white/15 bg-white/10 p-2 pr-6 text-left backdrop-blur-xl [animation-delay:600ms] md:border-line md:bg-surface md:shadow-soft"
    >
      <span
        aria-hidden="true"
        ref={fillRef}
        className={`absolute inset-y-0 left-0 w-0 bg-accent/20 ${
          dragging ? "" : `transition-[width] ${smooth}`
        }`}
      />
      <span
        aria-hidden="true"
        ref={knobRef}
        className={`relative z-10 grid size-14 shrink-0 place-items-center rounded-full bg-accent text-accent-fg shadow-glow ${
          dragging ? "" : `transition-transform ${smooth}`
        }`}
      >
        <span
          className={`grid size-full place-items-center animate-nudge transition-transform ${smooth} group-hover:translate-x-1.5 group-active:translate-x-3`}
        >
          <Scissors size={22} aria-hidden="true" />
        </span>
      </span>
      <span
        ref={contentRef}
        className={`relative z-10 flex flex-1 items-center gap-4 ${
          dragging ? "" : `transition-opacity ${smooth}`
        }`}
      >
        <span className="flex-1 text-lg font-medium">{label}</span>
        <span aria-hidden="true" className="flex">
          {chevronDelays.map((delay) => (
            <ChevronRight
              key={delay}
              size={20}
              className={`-mx-1 animate-chevron ${delay}`}
            />
          ))}
        </span>
      </span>
    </button>
  );
}
