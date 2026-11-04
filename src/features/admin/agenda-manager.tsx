"use client";

import { useQuery } from "@tanstack/react-query";
import { CalendarPlus, CircleCheck, X } from "lucide-react";
import { useState } from "react";
import * as z from "zod";
import type { TicketText } from "@/features/payments/model";
import type { Dictionary } from "@/shared/i18n/en";
import type { Locale } from "@/shared/i18n/locales";
import { Button } from "@/shared/ui/button";
import { Select } from "@/shared/ui/select";
import { groupAgenda } from "./agenda-groups";
import { AgendaRow } from "./agenda-row";
import { adminQuery, useAdminAction } from "./api";
import { Fold } from "./fold";
import { NewAppointmentForm } from "./new-appointment-form";
import {
  type AdminAppointment,
  branchSchema,
  staffAppointmentSchema,
} from "./schemas";
import { type AdminText, Panel, Result } from "./ui";

export const today = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 10);
};

export const dayQuery = (day: string, branchId = "") =>
  adminQuery(
    `appointments?date=${day}${branchId ? `&branchId=${branchId}` : ""}`,
    z.array(staffAppointmentSchema),
  );

const branchesQuery = adminQuery("branches", z.array(branchSchema));
const DAY = /^\d{4}-\d{2}-\d{2}$/;

export function AgendaManager({
  locale,
  t,
  status,
  ticket,
  canRefund,
  initialDay,
  initialBranch = "",
  currency,
}: {
  locale: Locale;
  t: AdminText;
  status: Dictionary["account"]["status"];
  ticket: TicketText;
  /** Owner and admin give money back; the API refuses everyone else anyway. */
  canRefund: boolean;
  /** From the URL (`?date=`), e.g. the "see all" link of the home page. */
  initialDay?: string | undefined;
  /** From the URL (`?branch=`). */
  initialBranch?: string | undefined;
  /** The shop's currency, for prices in the new-appointment form. */
  currency: string;
}) {
  const [day, setDay] = useState(() =>
    initialDay && DAY.test(initialDay) ? initialDay : today(),
  );
  const [branchId, setBranchId] = useState(initialBranch);
  const [adding, setAdding] = useState(false);
  /** The last thing saved, in words: the row it touched may have moved to a folded group. */
  const [notice, setNotice] = useState<string | null>(null);
  const branches = useQuery(branchesQuery);
  const appointments = useQuery(dayQuery(day, branchId));
  const action = useAdminAction();
  const groups = groupAgenda(appointments.data ?? []);
  // A single branch (chosen, or the only one visible) needs no heading.
  const headings = groups.length > 1;
  const row = (a: AdminAppointment) => (
    <AgendaRow
      key={a.id}
      a={a}
      locale={locale}
      t={t}
      status={status}
      ticket={ticket}
      canRefund={canRefund}
      action={action}
      onMoved={setDay}
      onDone={setNotice}
    />
  );

  return (
    <div className="grid gap-4">
      {/* One row always: day and branch shrink, the button shortens ("Nueva cita" → "Nueva" → icon). */}
      <div className="@container">
        <div className="flex items-end gap-2 @md:gap-3">
          <label className="grid min-w-0 shrink gap-2 text-sm">
            <span className="font-medium">{t.agenda.day}</span>
            <input
              type="date"
              value={day}
              onChange={(event) => setDay(event.target.value || today())}
              className="h-13 w-full min-w-0 rounded-2xl border border-line-strong bg-surface px-3 text-fg @md:px-4"
            />
          </label>
          {branches.data && branches.data.length > 1 && (
            <Select
              name="branchId"
              label={t.agenda.branch}
              value={branchId}
              className="min-w-0 flex-1 @3xl:max-w-xs @3xl:flex-none"
              onChange={(event) => setBranchId(event.target.value)}
            >
              <option value="">{t.agenda.allBranches}</option>
              {branches.data.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          )}
          <Button
            variant={adding ? "secondary" : "primary"}
            aria-label={adding ? t.common.close : t.agenda.newAppointment}
            title={adding ? t.common.close : t.agenda.newAppointment}
            className="ml-auto h-13! shrink-0 px-4! @md:px-5!"
            onClick={() => setAdding(!adding)}
          >
            {adding ? (
              <X size={18} aria-hidden="true" />
            ) : (
              <CalendarPlus size={18} aria-hidden="true" />
            )}
            <span aria-hidden="true" className="hidden @2xl:inline">
              {adding ? t.common.close : t.agenda.newAppointment}
            </span>
            <span aria-hidden="true" className="hidden @md:inline @2xl:hidden">
              {adding ? t.common.close : t.agenda.newShort}
            </span>
          </Button>
        </div>
      </div>
      {adding && (
        <Panel title={t.agenda.newAppointment}>
          <NewAppointmentForm
            locale={locale}
            t={t}
            day={day}
            currency={currency}
            onBooked={(date, message) => {
              setDay(date);
              setAdding(false);
              setNotice(message);
            }}
          />
        </Panel>
      )}
      {notice && (
        <div
          role="status"
          className="flex items-start justify-between gap-3 rounded-2xl border border-accent bg-card px-4 py-3 text-sm"
        >
          <p className="flex items-start gap-2">
            <CircleCheck
              size={18}
              aria-hidden="true"
              className="mt-0.5 shrink-0 text-accent-text"
            />
            {notice}
          </p>
          <button
            type="button"
            aria-label={t.common.close}
            className="-m-2 inline-flex size-11 shrink-0 items-center justify-center rounded-full text-fg-muted hover:text-fg"
            onClick={() => setNotice(null)}
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      )}
      {/* Errors only: a success is told by the notice above, with who and what. */}
      {action.data && !action.data.ok && (
        <Result result={action.data} t={t.common} />
      )}
      {appointments.isPending ? (
        <p className="text-fg-muted">{t.common.loading}</p>
      ) : groups.length === 0 ? (
        <p className="text-fg-muted">{t.agenda.empty}</p>
      ) : (
        groups.map((group) => (
          <section
            key={group.branchId}
            aria-label={group.branchName}
            className="grid gap-3"
          >
            {headings && (
              <h2 className="flex flex-wrap items-baseline gap-x-2 text-lg font-medium">
                {group.branchName}
                <span className="text-sm font-normal text-fg-muted">
                  {t.home.toAttend.replace("{n}", String(group.open.length))}
                </span>
              </h2>
            )}
            {group.open.length > 0 ? (
              <ul className="grid gap-2">{group.open.map(row)}</ul>
            ) : (
              <p className="text-sm text-fg-muted">{t.home.nothingLeft}</p>
            )}
            <Fold title={t.agenda.attended} count={group.done.length}>
              {group.done.map(row)}
            </Fold>
            <Fold title={t.agenda.closedGroup} count={group.closed.length}>
              {group.closed.map(row)}
            </Fold>
          </section>
        ))
      )}
    </div>
  );
}
