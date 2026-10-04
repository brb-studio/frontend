"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import * as z from "zod";
import type { Dictionary } from "@/shared/i18n/en";
import type { Locale } from "@/shared/i18n/locales";
import { pick } from "@/shared/i18n/localized";
import { formatMoney } from "@/shared/i18n/money";
import { adminQuery, useAdminAction } from "./api";
import { NewAppointmentForm } from "./new-appointment-form";
import { type AdminAppointment, staffAppointmentSchema } from "./schemas";
import { type AdminText, Panel, Result, Row, smallButton } from "./ui";

/** This device's calendar day, YYYY-MM-DD. */
export const today = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 10);
};

/** The appointments of one calendar day of this device. */
export function dayQuery(day: string) {
  const from = new Date(`${day}T00:00`);
  const to = new Date(from.getTime() + 24 * 60 * 60 * 1000);
  return adminQuery(
    `appointments?from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}`,
    z.array(staffAppointmentSchema),
  );
}

/** One day of appointments (this device's calendar day), with what staff do at the chair. */
export function AgendaManager({
  locale,
  t,
  status,
}: {
  locale: Locale;
  t: AdminText;
  status: Dictionary["account"]["status"];
}) {
  const [day, setDay] = useState(today);
  const [adding, setAdding] = useState(false);
  const appointments = useQuery(dayQuery(day));
  const action = useAdminAction();
  const change = (
    a: AdminAppointment,
    next: "completed" | "no_show" | "cancelled",
  ) =>
    action.mutate({
      method: "PATCH",
      path: `appointments/${a.id}`,
      body: { status: next },
    });
  const time = (a: AdminAppointment) =>
    new Intl.DateTimeFormat(locale, {
      hour: "numeric",
      minute: "2-digit",
      timeZone: a.timeZone,
    }).format(new Date(a.startAt));

  return (
    <Panel
      title={t.nav.agenda}
      action={
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-sm">
            <span className="text-fg-muted">{t.agenda.day}</span>
            <input
              type="date"
              value={day}
              onChange={(event) => setDay(event.target.value || today())}
              className="h-11 rounded-xl border border-line-strong bg-surface px-3 text-fg"
            />
          </label>
          <button
            type="button"
            className={smallButton}
            onClick={() => setAdding(!adding)}
          >
            {adding ? t.common.close : t.agenda.newAppointment}
          </button>
        </div>
      }
    >
      {adding && (
        <NewAppointmentForm
          locale={locale}
          t={t}
          day={day}
          onBooked={(date) => {
            setDay(date);
            setAdding(false);
          }}
        />
      )}
      <Result result={action.data} t={t.common} />
      {appointments.isPending ? (
        <p className="text-fg-muted">{t.common.loading}</p>
      ) : appointments.data && appointments.data.length > 0 ? (
        <ul className="grid gap-2">
          {appointments.data.map((a) => {
            const started = Date.parse(a.startAt) <= Date.now();
            return (
              <Row
                key={a.id}
                muted={a.status === "cancelled"}
                title={`${time(a)} · ${a.customer?.name ?? ""}`}
                meta={[
                  a.items.map((item) => pick(item.name, locale)).join(" + "),
                  a.barber?.name,
                  formatMoney(a.totalMinor, a.currency, locale),
                  status[a.status],
                  a.customer?.phone,
                  a.notes,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              >
                {a.status === "confirmed" && (
                  <>
                    {started && (
                      <>
                        <button
                          type="button"
                          className={smallButton}
                          disabled={action.isPending}
                          onClick={() => change(a, "completed")}
                        >
                          {t.agenda.complete}
                        </button>
                        <button
                          type="button"
                          className={smallButton}
                          disabled={action.isPending}
                          onClick={() => change(a, "no_show")}
                        >
                          {t.agenda.noShow}
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      className={smallButton}
                      disabled={action.isPending}
                      onClick={() => change(a, "cancelled")}
                    >
                      {t.agenda.cancel}
                    </button>
                  </>
                )}
              </Row>
            );
          })}
        </ul>
      ) : (
        <p className="text-fg-muted">{t.agenda.empty}</p>
      )}
    </Panel>
  );
}
