"use client";

import { House, MapPin, Scissors, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { key: "home", path: "/home", Icon: House },
  { key: "services", path: "/services", Icon: Scissors },
  { key: "branches", path: "/branches", Icon: MapPin },
  { key: "account", path: "/account", Icon: UserRound },
] as const;

type Labels = Record<(typeof items)[number]["key"] | "label", string>;

export function AppNav({
  labels,
  variant,
}: {
  labels: Labels;
  variant: "top" | "tabs";
}) {
  const [, locale, section = ""] = usePathname().split("/");
  const tabs = variant === "tabs";

  return (
    <nav
      aria-label={labels.label}
      className={
        tabs
          ? "fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-20 mx-auto max-w-sm md:hidden"
          : "hidden md:block"
      }
    >
      <ul
        className={
          tabs
            ? "flex items-center justify-between gap-1 rounded-full border border-white/10 bg-neutral-950/85 p-1.5 shadow-soft backdrop-blur-xl"
            : "flex gap-1"
        }
      >
        {items.map(({ key, path, Icon }) => (
          <li key={key}>
            <Link
              href={`/${locale}${path}`}
              aria-current={`/${section}` === path ? "page" : undefined}
              className={
                tabs
                  ? "group flex h-13 items-center gap-2 rounded-full p-1 text-sm font-medium text-white transition-[background-color,padding] duration-500 ease-out-expo aria-[current=page]:bg-white aria-[current=page]:pr-5 aria-[current=page]:text-neutral-950"
                  : "flex items-center gap-2 rounded-full px-4 py-2 text-sm text-fg-muted transition-colors hover:text-fg aria-[current=page]:bg-accent aria-[current=page]:text-accent-fg"
              }
            >
              {tabs ? (
                <>
                  <span className="grid size-11 place-items-center rounded-full bg-white/10 transition-colors duration-500 group-aria-[current=page]:bg-accent group-aria-[current=page]:text-accent-fg">
                    <Icon size={20} aria-hidden="true" />
                  </span>
                  <span className="sr-only group-aria-[current=page]:not-sr-only">
                    {labels[key]}
                  </span>
                </>
              ) : (
                <>
                  <Icon size={16} aria-hidden="true" />
                  {labels[key]}
                </>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
