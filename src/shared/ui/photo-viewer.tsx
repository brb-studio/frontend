"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Image from "next/image";
import {
  type PointerEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
  type WheelEvent,
} from "react";
import { createPortal } from "react-dom";

const MAX_SCALE = 4;
const DOUBLE_TAP_SCALE = 2.5;

type View = { scale: number; x: number; y: number };
const REST: View = { scale: 1, x: 0, y: 0 };

function clampView(view: View, box: DOMRect): View {
  const scale = Math.min(MAX_SCALE, Math.max(1, view.scale));
  const maxX = (box.width * (scale - 1)) / 2;
  const maxY = (box.height * (scale - 1)) / 2;
  return {
    scale,
    x: Math.min(maxX, Math.max(-maxX, view.x)),
    y: Math.min(maxY, Math.max(-maxY, view.y)),
  };
}

function ZoomableSlide({
  src,
  active,
  onZoom,
}: {
  src: string;
  active: boolean;
  onZoom: (zoomed: boolean) => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef({ distance: 0, view: REST, lastTap: 0 });
  const [view, setView] = useState(REST);
  const [moving, setMoving] = useState(false);

  useEffect(() => {
    if (!active) setView(REST);
  }, [active]);
  useEffect(() => onZoom(view.scale > 1), [view.scale, onZoom]);

  const rect = () => box.current?.getBoundingClientRect() ?? new DOMRect();
  const apply = (next: View) => setView(clampView(next, rect()));

  function zoomAt(scale: number, clientX: number, clientY: number) {
    const r = rect();
    const fromCenterX = clientX - (r.left + r.width / 2);
    const fromCenterY = clientY - (r.top + r.height / 2);
    const ratio = scale / view.scale;
    apply({
      scale,
      x: view.x * ratio - fromCenterX * (ratio - 1),
      y: view.y * ratio - fromCenterY * (ratio - 1),
    });
  }

  function down(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });
    const [a, b] = [...pointers.current.values()];
    gesture.current.view = view;
    gesture.current.distance = a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
    setMoving(true);
    if (pointers.current.size === 1) {
      const now = Date.now();
      if (now - gesture.current.lastTap < 300) {
        if (view.scale > 1) apply(REST);
        else zoomAt(DOUBLE_TAP_SCALE, event.clientX, event.clientY);
        gesture.current.lastTap = 0;
      } else {
        gesture.current.lastTap = now;
      }
    }
  }

  function move(event: PointerEvent<HTMLDivElement>) {
    const previous = pointers.current.get(event.pointerId);
    if (!previous) return;
    pointers.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });
    const [a, b] = [...pointers.current.values()];
    if (a && b && gesture.current.distance > 0) {
      const scale =
        (gesture.current.view.scale * Math.hypot(a.x - b.x, a.y - b.y)) /
        gesture.current.distance;
      zoomAt(scale, (a.x + b.x) / 2, (a.y + b.y) / 2);
      return;
    }
    if (view.scale > 1) {
      apply({
        ...view,
        x: view.x + event.clientX - previous.x,
        y: view.y + event.clientY - previous.y,
      });
    }
  }

  function up(event: PointerEvent<HTMLDivElement>) {
    pointers.current.delete(event.pointerId);
    if (pointers.current.size === 0) setMoving(false);
  }

  function wheel(event: WheelEvent<HTMLDivElement>) {
    if (!event.ctrlKey && view.scale === 1) return;
    const scale = view.scale * Math.exp(-event.deltaY / 200);
    zoomAt(scale, event.clientX, event.clientY);
  }

  return (
    <div
      ref={box}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      onWheel={wheel}
      className={`relative size-full shrink-0 snap-center overflow-hidden ${
        view.scale > 1
          ? "cursor-grab touch-none active:cursor-grabbing"
          : "cursor-zoom-in touch-pan-x"
      }`}
    >
      <div
        className={`absolute inset-0 ${moving ? "" : "transition-transform duration-300 ease-out"}`}
        style={{
          transform: `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.scale})`,
        }}
      >
        <Image
          src={src}
          alt=""
          fill
          sizes="100vw"
          draggable={false}
          className="object-contain select-none"
        />
      </div>
    </div>
  );
}

export function PhotoViewer({
  images,
  index,
  onClose,
  closeLabel,
}: {
  images: string[];
  index: number | undefined;
  onClose: () => void;
  closeLabel: string;
}) {
  const strip = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const open = index !== undefined;

  useEffect(() => {
    if (index === undefined) return;
    setPage(index);
    strip.current?.scrollTo({ left: index * window.innerWidth });
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [index]);

  const go = (to: number) => {
    const next = Math.min(images.length - 1, Math.max(0, to));
    strip.current?.scrollTo({
      left: next * (strip.current?.clientWidth ?? 0),
      behavior: "smooth",
    });
  };

  useEffect(() => {
    if (!open) return;
    const keys = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") go(page + 1);
      if (event.key === "ArrowLeft") go(page - 1);
    };
    document.addEventListener("keydown", keys);
    return () => document.removeEventListener("keydown", keys);
  });

  if (!open) return null;
  const control =
    "grid size-11 place-items-center rounded-full bg-white/15 text-white backdrop-blur-xl transition-colors hover:bg-white/25";

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] bg-black"
    >
      <div
        ref={strip}
        onScroll={(event) =>
          setPage(
            Math.round(
              event.currentTarget.scrollLeft / event.currentTarget.clientWidth,
            ),
          )
        }
        className={`flex size-full snap-x snap-mandatory overscroll-contain [scrollbar-width:none] ${
          zoomed ? "overflow-hidden" : "overflow-x-auto"
        }`}
      >
        {images.map((src, i) => (
          <ZoomableSlide
            key={src}
            src={src}
            active={i === page}
            onZoom={setZoomed}
          />
        ))}
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between p-4 pt-[max(1rem,env(safe-area-inset-top))]">
        {images.length > 1 ? (
          <span className="rounded-full bg-white/15 px-3 py-1.5 text-sm text-white tabular-nums backdrop-blur-xl">
            {page + 1} / {images.length}
          </span>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={onClose}
          aria-label={closeLabel}
          className={`pointer-events-auto ${control}`}
        >
          <X size={20} aria-hidden="true" />
        </button>
      </div>
      {images.length > 1 && !zoomed && (
        <>
          {page > 0 && (
            <button
              type="button"
              onClick={() => go(page - 1)}
              aria-label={`${page} / ${images.length}`}
              className={`absolute left-4 top-1/2 hidden -translate-y-1/2 md:grid ${control}`}
            >
              <ChevronLeft size={22} aria-hidden="true" />
            </button>
          )}
          {page < images.length - 1 && (
            <button
              type="button"
              onClick={() => go(page + 1)}
              aria-label={`${page + 2} / ${images.length}`}
              className={`absolute right-4 top-1/2 hidden -translate-y-1/2 md:grid ${control}`}
            >
              <ChevronRight size={22} aria-hidden="true" />
            </button>
          )}
        </>
      )}
    </div>,
    document.body,
  );
}

export function ZoomGallery({
  images,
  sizes,
  closeLabel,
  className,
  preloadFirst = false,
}: {
  images: string[];
  sizes: string;
  closeLabel: string;
  className: string;
  preloadFirst?: boolean;
}) {
  const [viewer, setViewer] = useState<number>();
  return (
    <>
      <div className={className}>
        {images.map((src, index) => (
          <button
            key={src}
            type="button"
            onClick={() => setViewer(index)}
            aria-label={`${index + 1} / ${images.length}`}
            className="relative size-full shrink-0 cursor-zoom-in snap-start"
          >
            <Image
              src={src}
              alt=""
              fill
              preload={preloadFirst && index === 0}
              sizes={sizes}
              className="object-cover"
            />
          </button>
        ))}
      </div>
      <PhotoViewer
        images={images}
        index={viewer}
        onClose={() => setViewer(undefined)}
        closeLabel={closeLabel}
      />
    </>
  );
}

export function PhotoButton({
  images,
  label,
  closeLabel,
  className,
  children,
}: {
  images: string[];
  label: string;
  closeLabel: string;
  className: string;
  children: ReactNode;
}) {
  const [viewer, setViewer] = useState<number>();
  return (
    <>
      <button
        type="button"
        onClick={() => setViewer(0)}
        aria-label={label}
        className={`cursor-zoom-in ${className}`}
      >
        {children}
      </button>
      <PhotoViewer
        images={images}
        index={viewer}
        onClose={() => setViewer(undefined)}
        closeLabel={closeLabel}
      />
    </>
  );
}
