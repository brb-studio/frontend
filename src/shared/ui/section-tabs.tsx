"use client";

import { useEffect, useRef, useState } from "react";

/** Below the sticky top bar (4rem) and this bar; sections use the same `scroll-mt-36`. */
const OFFSET = 144;

/**
 * Sticky segmented control for one long page: highlights the section in view
 * and jumps to a section on tap. Links are plain anchors, so it works without JS.
 */
export function SectionTabs({
  label,
  sections,
}: {
  label: string;
  sections: { id: string; label: string }[];
}) {
  const [active, setActive] = useState(0);
  // While a tapped jump scrolls past other sections, keep the tapped one lit.
  const jumping = useRef(false);

  useEffect(() => {
    let frame = 0;
    const spy = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (jumping.current) return;
        const atBottom =
          window.innerHeight + window.scrollY >=
          document.documentElement.scrollHeight - 2;
        let index = 0;
        sections.forEach(({ id }, i) => {
          const top = document.getElementById(id)?.getBoundingClientRect().top;
          if (top !== undefined && top <= OFFSET + 1) index = i;
        });
        setActive(atBottom ? sections.length - 1 : index);
      });
    };
    const settle = () => {
      jumping.current = false;
      spy();
    };
    spy();
    window.addEventListener("scroll", spy, { passive: true });
    window.addEventListener("scrollend", settle);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", spy);
      window.removeEventListener("scrollend", settle);
    };
  }, [sections]);

  return (
    <nav
      aria-label={label}
      className="sticky top-16 z-10 -mx-4 bg-canvas/80 px-4 py-2 backdrop-blur-xl"
    >
      <ul
        className="relative grid rounded-full border border-line bg-card p-1"
        style={{ gridTemplateColumns: `repeat(${sections.length}, 1fr)` }}
      >
        <span
          aria-hidden="true"
          className="absolute inset-y-1 left-1 rounded-full bg-accent transition-transform duration-500 ease-out-expo"
          style={{
            width: `calc((100% - 0.5rem) / ${sections.length})`,
            transform: `translateX(${active * 100}%)`,
          }}
        />
        {sections.map(({ id, label }, i) => (
          <li key={id} className="relative">
            <a
              href={`#${id}`}
              aria-current={i === active ? "location" : undefined}
              className="grid h-11 place-items-center rounded-full text-sm font-medium text-fg-muted transition-colors duration-300 aria-[current=location]:text-accent-fg"
              onClick={(event) => {
                event.preventDefault();
                jumping.current = true;
                setActive(i);
                history.replaceState(null, "", `#${id}`);
                document.getElementById(id)?.scrollIntoView({
                  behavior: matchMedia("(prefers-reduced-motion: reduce)")
                    .matches
                    ? "auto"
                    : "smooth",
                });
                // ponytail: fallback for browsers without `scrollend` (Safari < 26)
                setTimeout(() => {
                  jumping.current = false;
                }, 1000);
              }}
            >
              {label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
