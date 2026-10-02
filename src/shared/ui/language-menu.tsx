"use client";

import { Check, Globe } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { localeNames, locales } from "@/shared/i18n/locales";

export function LanguageMenu({ label }: { label: string }) {
  const [, current = "", ...rest] = usePathname().split("/");

  return (
    <>
      <button
        type="button"
        popoverTarget="language-menu"
        aria-label={`${label} (${current.toUpperCase()})`}
        className="language-menu-trigger flex h-10 items-center gap-2 rounded-full px-3 text-sm transition-colors hover:bg-glass"
      >
        <Globe size={18} aria-hidden="true" />
        <span className="uppercase">{current}</span>
      </button>
      <div
        id="language-menu"
        popover="auto"
        className="language-menu w-48 border border-line bg-sheet backdrop-blur-2xl scale-95 rounded-2xl p-2 text-fg opacity-0 shadow-soft transition-[opacity,scale,display,overlay] transition-discrete duration-200 open:scale-100 open:opacity-100 starting:open:scale-95 starting:open:opacity-0"
      >
        <ul className="grid gap-1">
          {locales.map((locale) => (
            <li key={locale}>
              <Link
                href={`/${[locale, ...rest].join("/")}`}
                hrefLang={locale}
                lang={locale}
                aria-current={locale === current ? "true" : undefined}
                onClick={(event) =>
                  event.currentTarget
                    .closest<HTMLElement>("[popover]")
                    ?.hidePopover()
                }
                className="flex items-center justify-between rounded-xl px-3 py-2 transition-colors hover:bg-glass aria-[current=true]:text-accent-text"
              >
                {localeNames[locale]}
                {locale === current && <Check size={16} aria-hidden="true" />}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
