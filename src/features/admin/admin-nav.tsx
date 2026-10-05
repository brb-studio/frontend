"use client";

import {
  BadgePercent,
  CalendarDays,
  CalendarOff,
  CircleUserRound,
  CreditCard,
  Ellipsis,
  LayoutDashboard,
  type LucideIcon,
  Scissors,
  Settings,
  Store,
  UserCog,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/shared/i18n/locales";
import { SECTIONS, type Section } from "./sections";
import type { AdminText } from "./ui";

const ICONS: Record<Section, LucideIcon> = {
  home: LayoutDashboard,
  agenda: CalendarDays,
  services: Scissors,
  barbers: Users,
  branches: Store,
  timeOff: CalendarOff,
  promotions: BadgePercent,
  team: UserCog,
  settings: Settings,
  billing: CreditCard,
  account: CircleUserRound,
};

// The phone tab bar fits four tabs plus "More"; the rest open from "More".
const TABS = 4;

type Props = {
  locale: Locale;
  sections: Section[];
  labels: AdminText["nav"];
};

function useHref(locale: Locale) {
  const pathname = usePathname();
  const href = (section: Section) => `/${locale}/admin${SECTIONS[section]}`;
  const current = (section: Section) =>
    pathname === href(section) ? ("page" as const) : undefined;
  return { href, current };
}

/** Desktop: the panel's sections down the sidebar. */
export function AdminSidebarNav({ locale, sections, labels }: Props) {
  const { href, current } = useHref(locale);
  return (
    <nav aria-label={labels.label}>
      <ul className="grid gap-1">
        {sections.map((section) => {
          const Icon = ICONS[section];
          return (
            <li key={section}>
              <Link
                href={href(section)}
                aria-current={current(section)}
                className="flex h-11 items-center gap-3 rounded-2xl px-3 text-sm text-fg-muted transition-colors hover:bg-surface hover:text-fg aria-[current=page]:bg-accent aria-[current=page]:font-medium aria-[current=page]:text-accent-fg"
              >
                <Icon size={18} aria-hidden="true" />
                {labels[section]}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Phones: a floating tab bar, thumb-reachable, with the overflow in a "More" popover. */
export function AdminTabBar({ locale, sections, labels }: Props) {
  const { href, current } = useHref(locale);
  const overflow = sections.length > TABS + 1;
  const tabs = overflow ? sections.slice(0, TABS) : sections;
  const more = overflow ? sections.slice(TABS) : [];
  const tab =
    "group flex h-13 flex-col items-center justify-center gap-0.5 rounded-full px-3 text-[0.6875rem] font-medium text-white/70 transition-colors aria-[current=page]:bg-white aria-[current=page]:text-neutral-950";

  return (
    <nav
      aria-label={labels.label}
      className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-20 mx-auto max-w-md md:hidden"
    >
      <ul className="flex items-center justify-between gap-1 rounded-full border border-white/10 bg-neutral-950/90 p-1.5 shadow-soft backdrop-blur-xl">
        {tabs.map((section) => {
          const Icon = ICONS[section];
          return (
            <li key={section} className="flex-1">
              <Link
                href={href(section)}
                aria-current={current(section)}
                className={tab}
              >
                <Icon size={20} aria-hidden="true" />
                {labels[section]}
              </Link>
            </li>
          );
        })}
        {overflow && (
          <li className="flex-1">
            <button
              type="button"
              popoverTarget="admin-more"
              aria-current={more.some(current) ? "page" : undefined}
              className={`${tab} w-full`}
            >
              <Ellipsis size={20} aria-hidden="true" />
              {labels.more}
            </button>
          </li>
        )}
      </ul>
      {overflow && (
        <div
          id="admin-more"
          popover="auto"
          className="fixed inset-x-3 top-auto bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))+4.75rem)] mx-auto max-w-md rounded-3xl border border-line bg-card p-2 text-fg shadow-soft"
        >
          <ul className="grid gap-1">
            {more.map((section) => {
              const Icon = ICONS[section];
              return (
                <li key={section}>
                  <Link
                    href={href(section)}
                    aria-current={current(section)}
                    onClick={(event) =>
                      event.currentTarget
                        .closest<HTMLElement>("[popover]")
                        ?.hidePopover()
                    }
                    className="flex h-12 items-center gap-3 rounded-2xl px-3 text-sm transition-colors hover:bg-surface aria-[current=page]:bg-accent aria-[current=page]:text-accent-fg"
                  >
                    <Icon size={18} aria-hidden="true" />
                    {labels[section]}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </nav>
  );
}
