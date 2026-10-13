"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import type { Dictionary } from "@/shared/i18n/en";
import type { Locale } from "@/shared/i18n/locales";
import { pick } from "@/shared/i18n/localized";
import { Button, ButtonLink } from "@/shared/ui/button";
import { leaveWaitlist } from "./actions";
import { myWaitlistKey, myWaitlistQuery } from "./model";

const dayOf = (date: string, locale: Locale) =>
  new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));

export function MyWaitlist({
  locale,
  t,
}: {
  locale: Locale;
  t: Dictionary["waitlist"];
}) {
  const queryClient = useQueryClient();
  const list = useQuery(myWaitlistQuery());
  const leave = useMutation({
    mutationFn: leaveWaitlist,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: myWaitlistKey }),
  });
  if (!list.data || list.data.length === 0) return null;

  return (
    <section aria-labelledby="my-waitlist" className="grid gap-3">
      <h2 id="my-waitlist" className="font-medium text-xl">
        {t.mine}
      </h2>
      <ul className="grid gap-3">
        {list.data.map((entry) => (
          <li
            key={entry.id}
            className="grid gap-2 rounded-3xl border border-line bg-card px-4 py-3 text-sm"
          >
            <p className="flex justify-between gap-3 font-medium">
              <span className="first-letter:uppercase">
                {dayOf(entry.date, locale)}
              </span>
              <span className="shrink-0 text-fg-muted">
                {t.status[entry.status]}
              </span>
            </p>
            <p className="text-fg-muted">
              {pick(entry.item.name, locale)} · {entry.branch.name}
            </p>
            <div className="flex flex-wrap gap-2">
              {entry.status === "notified" && (
                <ButtonLink
                  href={`/${locale}/services/${entry.item.slug}?branch=${entry.branch.slug}`}
                >
                  {t.book}
                </ButtonLink>
              )}
              <Button
                type="button"
                variant="secondary"
                disabled={leave.isPending}
                onClick={() => leave.mutate(entry.id)}
              >
                <Trash2 size={16} aria-hidden="true" />
                {t.leave}
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
