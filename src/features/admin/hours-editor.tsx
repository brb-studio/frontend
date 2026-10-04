"use client";

import { Plus, X } from "lucide-react";
import type { Locale } from "@/shared/i18n/locales";
import type { HoursRow } from "./schemas";
import type { AdminText } from "./ui";

// Monday first; weekday numbers are 0 = Sunday … 6 = Saturday.
const WEEK = [1, 2, 3, 4, 5, 6, 0];
const timeInput =
  "h-11 rounded-xl border border-line-strong bg-surface px-3 text-fg focus:border-accent-text";

const dayName = (weekday: number, locale: Locale) =>
  new Intl.DateTimeFormat(locale, { weekday: "long", timeZone: "UTC" }).format(
    new Date(Date.UTC(2024, 0, 7 + weekday)),
  );

/**
 * Weekly hours: each day open or closed, with an optional second shift (the gap between the two is
 * the break). Times are wall-clock in the branch's timezone.
 */
export function HoursEditor({
  value,
  onChange,
  locale,
  t,
}: {
  value: HoursRow[];
  onChange: (hours: HoursRow[]) => void;
  locale: Locale;
  t: AdminText["hours"];
}) {
  const of = (weekday: number) =>
    value
      .filter((h) => h.weekday === weekday)
      .sort((a, b) => a.open.localeCompare(b.open));
  const replace = (weekday: number, rows: HoursRow[]) =>
    onChange([...value.filter((h) => h.weekday !== weekday), ...rows]);

  return (
    <div className="grid gap-3">
      {WEEK.map((weekday) => {
        const rows = of(weekday);
        const open = rows.length > 0;
        return (
          <fieldset
            key={weekday}
            className="grid gap-2 border-b border-line pb-3 last:border-b-0"
          >
            <legend className="sr-only">{dayName(weekday, locale)}</legend>
            <label className="flex min-h-11 items-center gap-3 text-sm font-medium first-letter:uppercase">
              <input
                type="checkbox"
                checked={open}
                onChange={(event) =>
                  replace(
                    weekday,
                    event.target.checked
                      ? [{ weekday, open: "09:00", close: "20:00" }]
                      : [],
                  )
                }
                className="size-5 accent-[var(--color-accent)]"
              />
              <span className="first-letter:uppercase">
                {dayName(weekday, locale)}
              </span>
              {!open && (
                <span className="font-normal text-fg-muted">{t.closed}</span>
              )}
            </label>
            {rows.map((row, index) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: a day's shifts are positional (first, second); keying by time would remount the input mid-typing.
                key={index}
                className="flex flex-wrap items-center gap-2 pl-8 text-sm"
              >
                <label className="flex items-center gap-2">
                  <span className="text-fg-muted">{t.open}</span>
                  <input
                    type="time"
                    step={900}
                    value={row.open}
                    onChange={(event) =>
                      replace(
                        weekday,
                        rows.map((r, i) =>
                          i === index ? { ...r, open: event.target.value } : r,
                        ),
                      )
                    }
                    className={timeInput}
                  />
                </label>
                <label className="flex items-center gap-2">
                  <span className="text-fg-muted">{t.close}</span>
                  <input
                    type="time"
                    step={900}
                    value={row.close}
                    onChange={(event) =>
                      replace(
                        weekday,
                        rows.map((r, i) =>
                          i === index ? { ...r, close: event.target.value } : r,
                        ),
                      )
                    }
                    className={timeInput}
                  />
                </label>
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      replace(
                        weekday,
                        rows.filter((_, i) => i !== index),
                      )
                    }
                    className="grid size-10 place-items-center rounded-full border border-line hover:border-accent-text"
                  >
                    <X size={16} aria-hidden="true" />
                    <span className="sr-only">{t.removeShift}</span>
                  </button>
                )}
              </div>
            ))}
            {rows.length === 1 && (
              <button
                type="button"
                onClick={() =>
                  replace(weekday, [
                    ...rows,
                    { weekday, open: "16:00", close: "20:00" },
                  ])
                }
                className="ml-8 flex w-fit items-center gap-1 text-sm text-accent-text"
              >
                <Plus size={16} aria-hidden="true" />
                {t.addShift}
              </button>
            )}
          </fieldset>
        );
      })}
    </div>
  );
}
