"use client";

import { Menu, X } from "lucide-react";
import { useRef } from "react";
import type { LandingDictionary } from "@/shared/i18n/landing-en";

const LINKS = [
  ["#producto", "product"],
  ["#precio", "pricing"],
  ["#contacto", "contact"],
] as const;

export function MobileNav({
  nav,
  a11y,
}: {
  nav: LandingDictionary["nav"];
  a11y: LandingDictionary["a11y"];
}) {
  const panel = useRef<HTMLDivElement>(null);
  return (
    <>
      <button
        type="button"
        className="lp-menu-btn"
        popoverTarget="lp-menu"
        aria-label={a11y.menu}
      >
        <Menu size={20} aria-hidden="true" />
      </button>
      <div id="lp-menu" ref={panel} popover="auto" className="lp-menu">
        <p className="lp-mono lp-menu__label">{a11y.nav}</p>
        <nav aria-label={a11y.nav}>
          <ol className="lp-menu__list">
            {LINKS.map(([href, key], i) => (
              <li key={href}>
                <a
                  href={href}
                  onClick={(event) => {
                    event.preventDefault();
                    panel.current?.hidePopover();
                    requestAnimationFrame(() => {
                      if (location.hash === href) {
                        document.querySelector(href)?.scrollIntoView();
                      } else {
                        location.hash = href;
                      }
                    });
                  }}
                >
                  <span className="lp-mono" aria-hidden="true">
                    0{i + 1}
                  </span>
                  {nav[key]}
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <button
          type="button"
          className="lp-menu-btn lp-menu__close"
          popoverTarget="lp-menu"
          popoverTargetAction="hide"
          aria-label={a11y.closeMenu}
        >
          <X size={20} aria-hidden="true" />
        </button>
      </div>
    </>
  );
}
