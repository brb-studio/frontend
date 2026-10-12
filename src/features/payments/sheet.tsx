"use client";

import { X } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";

/** A bottom sheet over the page (full width on phones, centered card on desktop), closed with Esc. */
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
  useEffect(() => setMounted(true), []);

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
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-500 ${open ? "opacity-100" : "opacity-0"}`}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-sheet-title"
        className={`relative flex max-h-[90dvh] w-full flex-col rounded-t-[2rem] border border-b-0 border-line bg-sheet text-fg shadow-soft backdrop-blur-2xl transition-[translate,opacity] duration-500 ease-spring md:max-w-lg md:rounded-[2rem] md:border-b ${open ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 md:translate-y-8"}`}
      >
        <header className="shrink-0 px-5 pt-3">
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
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          {open && children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
