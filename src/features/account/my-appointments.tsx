"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, CalendarX, CreditCard } from "lucide-react";
import { useEffect, useState } from "react";
import { ticketLine } from "@/features/payments/model";
import type { Dictionary } from "@/shared/i18n/en";
import type { Locale } from "@/shared/i18n/locales";
import { pick } from "@/shared/i18n/localized";
import { formatMoney } from "@/shared/i18n/money";
import { Button, ButtonLink } from "@/shared/ui/button";
import { FormAlert } from "@/shared/ui/form";
import { PAGE_SIZES, Pager } from "@/shared/ui/pager";
import { cancelAppointment } from "./actions";
import {
  type Appointment,
  myAppointmentsKey,
  myAppointmentsQuery,
  myHistoryQuery,
} from "./model";
import { ReschedulePanel } from "./reschedule-panel";

const when = (a: Appointment, locale: Locale) =>
  new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "numeric",
    minute: "2-digit",
    timeZone: a.timeZone,
  }).format(new Date(a.startAt));

export function MyAppointments({
  locale,
  t,
  tp,
}: {
  locale: Locale;
  t: Dictionary["account"];
  tp: Dictionary["payment"];
}) {
  const queryClient = useQueryClient();
  const appointments = useQuery(myAppointmentsQuery());
  const [error, setError] = useState<"tooLate" | "unavailable" | null>(null);
  const [rescheduling, setRescheduling] = useState<string | null>(null);
  const [moved, setMoved] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZES[0]);
  const history = useQuery(myHistoryQuery(page, pageSize));
  const total = history.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    if (history.data && page > pages) setPage(pages);
  }, [history.data, page, pages]);

  const [confirming, setConfirming] = useState<string | null>(null);
  const cancelling = useMutation({
    mutationFn: cancelAppointment,
    onSuccess: (result) => {
      setConfirming(null);
      setError(result.ok ? null : result.error);
      setMoved(false);
      void queryClient.invalidateQueries({ queryKey: myAppointmentsKey });
    },
  });

  if (appointments.isPending)
    return <p className="text-fg-muted">{t.loading}</p>;
  const list = appointments.data ?? [];
  const now = Date.now();
  const upcoming = list
    .filter(
      (a) =>
        (a.status === "confirmed" || a.status === "pending_payment") &&
        Date.parse(a.endAt) > now,
    )
    .reverse();
  const deadline = (a: Appointment) =>
    a.paymentDeadline &&
    new Intl.DateTimeFormat(locale, {
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(a.paymentDeadline));

  const row = (a: Appointment) => (
    <li
      key={a.id}
      className="grid gap-1 rounded-3xl border border-line bg-card px-4 py-3 text-sm"
    >
      <p className="flex justify-between gap-3 font-medium">
        <span className="first-letter:uppercase">{when(a, locale)}</span>
        <span className="shrink-0 text-fg-muted">{t.status[a.status]}</span>
      </p>
      <p>
        {a.items.map((item) => pick(item.name, locale)).join(" + ")} ·{" "}
        {a.barber?.name}
      </p>
      <p className="flex flex-wrap items-center justify-between gap-3 text-fg-muted">
        <span>
          {a.branch?.name} · {formatMoney(a.totalMinor, a.currency, locale)}
          {a.payment && (
            <>
              {" "}
              ·{" "}
              {ticketLine(a.payment, tp.ticket, (minor) =>
                formatMoney(minor, a.currency, locale),
              )}
            </>
          )}
        </span>
        {a.cancellable && confirming !== a.id && (
          <span className="flex shrink-0 gap-2">
            <Button
              variant="secondary"
              onClick={() =>
                setRescheduling((current) => (current === a.id ? null : a.id))
              }
            >
              <CalendarClock size={16} aria-hidden="true" />
              {t.reschedule}
            </Button>
            <Button
              variant="secondary"
              onClick={() => setConfirming(a.id)}
              disabled={cancelling.isPending}
            >
              <CalendarX size={16} aria-hidden="true" />
              {t.cancel}
            </Button>
          </span>
        )}
      </p>
      {a.status === "pending_payment" && (
        <p className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-2 text-fg-muted">
          <span>{tp.payBefore.replace("{time}", deadline(a) || "")}</span>
          <span className="flex shrink-0 gap-2">
            <ButtonLink href={`/${locale}/pay/${a.id}`}>
              <CreditCard size={16} aria-hidden="true" />
              {tp.completePayment}
            </ButtonLink>
            <Button
              variant="secondary"
              onClick={() => cancelling.mutate(a.id)}
              disabled={cancelling.isPending}
            >
              <CalendarX size={16} aria-hidden="true" />
              {t.cancel}
            </Button>
          </span>
        </p>
      )}
      {rescheduling === a.id && (
        <ReschedulePanel
          appointment={a}
          locale={locale}
          t={t}
          onMoved={() => {
            setRescheduling(null);
            setMoved(true);
          }}
        />
      )}
      {a.cancellable && confirming === a.id && (
        <div
          role="alert"
          className="mt-2 grid gap-3 border-t border-line pt-3 text-fg"
        >
          <p className="font-medium">{t.cancelConfirm}</p>
          {a.payment?.status === "paid" &&
            a.payment.refundableMinor !== undefined && (
              <p className="text-sm text-fg-muted">
                {t.cancelRefund.replace(
                  "{amount}",
                  formatMoney(a.payment.refundableMinor, a.currency, locale),
                )}
              </p>
            )}
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setConfirming(null)}
              disabled={cancelling.isPending}
            >
              {t.cancelKeep}
            </Button>
            <Button
              onClick={() => cancelling.mutate(a.id)}
              disabled={cancelling.isPending}
            >
              <CalendarX size={16} aria-hidden="true" />
              {t.cancelYes}
            </Button>
          </div>
        </div>
      )}
    </li>
  );

  return (
    <div className="grid gap-6">
      {error && <FormAlert>{t.cancelErrors[error]}</FormAlert>}
      {moved && (
        <p
          role="status"
          className="rounded-2xl border border-accent/40 bg-card p-4 text-sm"
        >
          {t.moved}
        </p>
      )}
      <section aria-labelledby="upcoming-title" className="grid gap-3">
        <h2 id="upcoming-title" className="text-xl font-medium">
          {t.upcoming}
        </h2>
        {upcoming.length > 0 ? (
          <ul className="grid gap-2">{upcoming.map(row)}</ul>
        ) : (
          <div className="grid justify-items-start gap-3">
            <p className="text-fg-muted">{t.noAppointments}</p>
            <ButtonLink href={`/${locale}/services`}>{t.book}</ButtonLink>
          </div>
        )}
      </section>
      {history.data && total > 0 && (
        <section aria-labelledby="history-title" className="grid gap-3">
          <h2 id="history-title" className="text-xl font-medium">
            {t.history}
          </h2>
          <ul className="grid gap-2">{history.data.items.map(row)}</ul>
          <Pager
            label={t.history}
            page={page}
            pageSize={pageSize}
            total={total}
            shown={history.data.items.length}
            onPage={setPage}
            onPageSize={setPageSize}
            t={t}
          />
        </section>
      )}
    </div>
  );
}
