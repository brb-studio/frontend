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
import { GROUPS, type Group, SECTIONS, type Section } from "./sections";
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
  groups: AdminText["navGroups"];
};

function useHref(locale: Locale) {
  const pathname = usePathname();
  const href = (section: Section) => `/${locale}/admin${SECTIONS[section]}`;
  const current = (section: Section) =>
    pathname === href(section) ? ("page" as const) : undefined;
  return { href, current };
}

/** The role's sections, grouped in menu order; empty groups are dropped. */
const grouped = (sections: Section[]) =>
  (Object.keys(GROUPS) as Group[])
    .map((group) => ({
      group,
      items: GROUPS[group].filter((section) => sections.includes(section)),
    }))
    .filter(({ items }) => items.length > 0);

/** Desktop: the panel's sections down the sidebar, in labeled groups. */
export function AdminSidebarNav({ locale, sections, labels, groups }: Props) {
  const { href, current } = useHref(locale);
  return (
    <nav aria-label={labels.label} className="grid gap-5">
      {grouped(sections).map(({ group, items }) => (
        <div key={group} className="grid gap-1">
          <p className="px-3 text-xs font-medium uppercase tracking-wide text-fg-muted">
            {groups[group]}
          </p>
          <ul className="grid gap-0.5">
            {items.map((section) => {
              const Icon = ICONS[section];
              return (
                <li key={section}>
                  <Link
                    href={href(section)}
                    aria-current={current(section)}
                    className="flex h-10 items-center gap-3 rounded-xl px-3 text-sm text-fg-muted transition-colors hover:bg-canvas hover:text-fg aria-[current=page]:bg-accent aria-[current=page]:font-medium aria-[current=page]:text-accent-fg"
                  >
                    <Icon size={18} aria-hidden="true" />
                    {labels[section]}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

/**
 * Phones: a solid tab bar within thumb reach. Past five sections, the first four stay as tabs and
 * the rest open in a "More" sheet anchored above the bar (native popover: Esc and tapping outside close it).
 */
export function AdminTabBar({ locale, sections, labels, groups }: Props) {
  const { href, current } = useHref(locale);
  const overflow = sections.length > TABS + 1;
  const tabs = overflow ? sections.slice(0, TABS) : sections;
  const more = overflow ? sections.slice(TABS) : [];
  const tab =
    "flex h-14 w-full flex-col items-center justify-center gap-1 rounded-2xl text-[0.6875rem] font-medium text-white/70 transition-colors hover:text-white aria-[current=page]:bg-white aria-[current=page]:text-neutral-950";
  const close = (event: React.MouseEvent<HTMLElement>) =>
    event.currentTarget.closest<HTMLElement>("[popover]")?.hidePopover();

  return (
    <nav
      aria-label={labels.label}
      className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-20 mx-auto max-w-md md:hidden"
    >
      <ul className="flex items-center gap-1 rounded-3xl bg-neutral-950 p-1.5 shadow-soft">
        {tabs.map((section) => {
          const Icon = ICONS[section];
          return (
            <li key={section} className="min-w-0 flex-1">
              <Link
                href={href(section)}
                aria-current={current(section)}
                className={tab}
              >
                <Icon size={20} aria-hidden="true" />
                <span className="max-w-full truncate px-1">
                  {labels[section]}
                </span>
              </Link>
            </li>
          );
        })}
        {overflow && (
          <li className="min-w-0 flex-1">
            <button
              type="button"
              popoverTarget="admin-more"
              aria-current={more.some(current) ? "page" : undefined}
              className={tab}
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
          className="inset-x-3 top-auto bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))+5rem)] m-0 mx-auto w-auto max-w-md rounded-3xl border border-line bg-surface p-3 text-fg shadow-soft backdrop:bg-black/40"
        >
          {grouped(more).map(({ group, items }) => (
            <div key={group} className="grid gap-2 p-1">
              <p className="px-1 text-xs font-medium uppercase tracking-wide text-fg-muted">
                {groups[group]}
              </p>
              <ul className="grid grid-cols-3 gap-2">
                {items.map((section) => {
                  const Icon = ICONS[section];
                  return (
                    <li key={section}>
                      <Link
                        href={href(section)}
                        aria-current={current(section)}
                        onClick={close}
                        className="flex h-20 flex-col items-center justify-center gap-2 rounded-2xl border border-line bg-canvas px-1 text-center text-xs font-medium transition-colors hover:border-accent-text aria-[current=page]:border-accent aria-[current=page]:bg-accent aria-[current=page]:text-accent-fg"
                      >
                        <Icon size={22} aria-hidden="true" />
                        {labels[section]}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </nav>
  );
}
