"use client";

import {
  ArrowLeftRight,
  Banknote,
  CalendarClock,
  Check,
  CreditCard,
  type LucideIcon,
  Phone,
  Undo2,
  UserX,
  X,
} from "lucide-react";
import Link from "next/link";
import { type ComponentProps, type ReactNode, useState } from "react";
import { type TicketText, ticketLine } from "@/features/payments/model";
import type { Dictionary } from "@/shared/i18n/en";
import type { Locale } from "@/shared/i18n/locales";
import { pick } from "@/shared/i18n/localized";
import { formatMoney } from "@/shared/i18n/money";
import { Button } from "@/shared/ui/button";
import type { useAdminAction } from "./api";
import { RescheduleForm } from "./reschedule-form";
import {
  type AdminAppointment,
  COUNTER_METHODS,
  type CounterMethod,
} from "./schemas";
import type { AdminText } from "./ui";

/** What the staff is about to do: nothing is saved until it is confirmed. */
type Pending =
  | { kind: "charge"; method: CounterMethod }
  | { kind: "complete" }
  | { kind: "no_show" }
  | { kind: "cancel" };

const METHOD_ICON: Record<CounterMethod, LucideIcon> = {
  cash: Banknote,
  card: CreditCard,
  transfer: ArrowLeftRight,
};

/** A full-width action of the card's grid: same size as its neighbours, whatever the label. */
function Action({
  icon: Icon,
  danger = false,
  children,
  ...button
}: ComponentProps<"button"> & {
  icon: LucideIcon;
  danger?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={`flex min-h-16 w-full min-w-0 flex-col items-center justify-center gap-1 rounded-2xl border px-2 py-2 text-sm leading-tight font-medium @4xl:min-h-12 @4xl:flex-row @4xl:gap-2 @4xl:px-3 transition-colors disabled:opacity-50 ${danger ? "border-danger/50 text-danger hover:border-danger hover:bg-danger/5" : "border-line bg-card hover:border-accent"}`}
      {...button}
    >
      <Icon size={18} aria-hidden="true" className="shrink-0" />
      <span className="min-w-0 text-center [overflow-wrap:anywhere]">
        {children}
      </span>
    </button>
  );
}

/** Lets a confirm button's label wrap instead of spilling out on a narrow card. */
const wraps =
  "h-auto! min-h-12 px-3! py-2 text-center leading-tight whitespace-normal!";

const cols = (n: number) =>
  n >= 3 ? "grid-cols-3" : n === 2 ? "grid-cols-2" : "grid-cols-1";

/** One appointment of the Agenda: who and what on one side, its actions on the other, each confirmed first. */
export function AgendaRow({
  a,
  locale,
  t,
  status,
  ticket,
  canRefund,
  action,
  onMoved,
  onDone,
}: {
  a: AdminAppointment;
  locale: Locale;
  t: AdminText;
  status: Dictionary["account"]["status"];
  ticket: TicketText;
  canRefund: boolean;
  action: ReturnType<typeof useAdminAction>;
  onMoved: (date: string) => void;
  /** What was saved, in words, for the Agenda to show once the row has moved away. */
  onDone: (message: string) => void;
}) {
  const [refunding, setRefunding] = useState(false);
  const [moving, setMoving] = useState(false);
  const [pending, setPending] = useState<Pending | null>(null);
  const [reason, setReason] = useState("");
  const started = Date.parse(a.startAt) <= Date.now();
  const money = (minor: number) => formatMoney(minor, a.currency, locale);
  const time = new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
    timeZone: a.timeZone,
  }).format(new Date(a.startAt));
  const services = a.items.map((item) => pick(item.name, locale)).join(" + ");
  const who = [a.customer?.name, time, services, a.barber?.name]
    .filter(Boolean)
    .join(" · ");
  const open = a.status === "confirmed";
  const toClose = open && started;
  const quiet = a.status === "cancelled" || a.status === "no_show";
  const text = t.agenda;
  const due = a.dueMinor ?? 0;
  const refundable =
    canRefund &&
    a.payment?.provider === "stripe" &&
    a.payment.status === "paid" &&
    a.payment.method !== undefined;

  const words = (p: Pending) => {
    const fill = (s: string) =>
      p.kind === "charge"
        ? s
            .replace("{amount}", money(due))
            .replace("{method}", t.methods[p.method])
        : s;
    const [question, yes, done] =
      p.kind === "charge"
        ? [text.confirmCharge, text.yesCharge, text.doneCharge]
        : p.kind === "complete"
          ? [text.confirmComplete, text.yesComplete, text.doneComplete]
          : p.kind === "no_show"
            ? [text.confirmNoShow, text.yesNoShow, text.doneNoShow]
            : [text.confirmCancel, text.yesCancel, text.doneCancel];
    return { question: fill(question), yes: fill(yes), done: fill(done) };
  };

  const confirm = (p: Pending) => {
    const note = reason.trim();
    const body =
      p.kind === "cancel"
        ? { status: "cancelled", ...(note && { cancelReason: note }) }
        : p.kind === "charge"
          ? { status: "completed", paidWith: p.method }
          : { status: p.kind === "complete" ? "completed" : "no_show" };
    const done = words(p).done.replace("{who}", who);
    action.mutate(
      { method: "PATCH", path: `appointments/${a.id}`, body },
      {
        onSuccess: (result) => {
          setPending(null);
          if (result.ok) onDone(done);
        },
      },
    );
  };

  const secondary = [
    ...(started
      ? [
          <Action
            key="no-show"
            icon={UserX}
            onClick={() => setPending({ kind: "no_show" })}
          >
            {text.noShow}
          </Action>,
        ]
      : []),
    <Action
      key="move"
      icon={CalendarClock}
      aria-expanded={moving}
      onClick={() => setMoving(!moving)}
    >
      {moving ? t.common.close : text.reschedule}
    </Action>,
    <Action
      key="cancel"
      icon={X}
      danger
      onClick={() => {
        setReason("");
        setPending({ kind: "cancel" });
      }}
    >
      {text.cancel}
    </Action>,
  ];

  const actions = pending ? (
    <div
      role="alertdialog"
      aria-label={words(pending).question}
      className={`grid gap-3 rounded-2xl border p-4 ${pending.kind === "cancel" ? "border-danger/60" : "border-accent"}`}
    >
      <div className="grid gap-1">
        <p className="font-medium">{words(pending).question}</p>
        <p className="text-sm text-fg-muted">{who}</p>
        <p className="text-xs text-fg-muted">
          {pending.kind === "cancel"
            ? `${text.cancelWarning} ${text.cannotUndo}`
            : text.cannotUndo}
        </p>
      </div>
      {pending.kind === "cancel" && (
        <label className="grid gap-1.5 text-sm">
          <span className="text-fg-muted">{text.cancelReason}</span>
          <input
            value={reason}
            maxLength={200}
            onChange={(event) => setReason(event.target.value)}
            className="h-11 rounded-xl border border-line-strong bg-surface px-3 text-fg"
          />
        </label>
      )}
      <div className="grid grid-cols-2 gap-2">
        {/* Focus lands on "back", so a stray Enter never confirms. */}
        <Button
          variant="secondary"
          autoFocus
          className={wraps}
          onClick={() => setPending(null)}
        >
          {text.back}
        </Button>
        <Button
          variant={pending.kind === "cancel" ? "danger" : "primary"}
          disabled={action.isPending}
          className={wraps}
          onClick={() => confirm(pending)}
        >
          {words(pending).yes}
        </Button>
      </div>
    </div>
  ) : open || refundable ? (
    // Only "reschedule" and "cancel" (not started yet): one short row, centred against the details.
    <div
      className={`grid gap-2 ${open && !started && !refundable ? "@4xl:self-center" : ""}`}
    >
      {toClose &&
        (due > 0 ? (
          <>
            <p className="text-sm font-medium">
              {text.charge.replace("{amount}", money(due))}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {COUNTER_METHODS.map((method) => (
                <Action
                  key={method}
                  icon={METHOD_ICON[method]}
                  onClick={() => setPending({ kind: "charge", method })}
                >
                  {t.methods[method]}
                </Action>
              ))}
            </div>
          </>
        ) : (
          <Action icon={Check} onClick={() => setPending({ kind: "complete" })}>
            {text.complete}
          </Action>
        ))}
      {open && (
        <div className={`grid gap-2 ${cols(secondary.length)}`}>
          {secondary}
        </div>
      )}
      {refundable &&
        (refunding ? (
          <div className="grid gap-2 rounded-2xl border border-line p-3">
            <p className="text-sm">{text.refundConfirm}</p>
            <div className="grid grid-cols-2 gap-2">
              <Action icon={X} onClick={() => setRefunding(false)}>
                {t.common.close}
              </Action>
              <Action
                icon={Undo2}
                disabled={action.isPending}
                onClick={() =>
                  action.mutate(
                    {
                      method: "POST",
                      path: `payments/appointments/${a.id}/refund`,
                      body: {},
                    },
                    { onSettled: () => setRefunding(false) },
                  )
                }
              >
                {text.refund}
              </Action>
            </div>
          </div>
        ) : (
          <Action icon={Undo2} onClick={() => setRefunding(true)}>
            {text.refund}
          </Action>
        ))}
    </div>
  ) : null;

  return (
    <li
      className={`@container rounded-3xl border bg-surface ${toClose ? "border-accent" : "border-line"}`}
    >
      <div
        className={`grid gap-4 p-4 @4xl:p-5 ${actions ? "@4xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] @4xl:items-start @4xl:gap-6" : ""}`}
      >
        <div className={`grid min-w-0 gap-1 ${quiet ? "opacity-60" : ""}`}>
          <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-xl font-semibold tabular-nums">{time}</span>
            <span className="text-base font-medium">{a.customer?.name}</span>
          </p>
          <p className="text-sm">
            {services} · {money(a.totalMinor)}
          </p>
          <p className="flex flex-wrap items-center gap-2 text-sm text-fg-muted">
            {a.barber?.name && <span>{a.barber.name}</span>}
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${toClose ? "bg-accent text-accent-fg" : "border border-line"}`}
            >
              {toClose ? text.toClose : status[a.status]}
            </span>
          </p>
          {a.payment && (
            <p className="text-sm text-fg-muted">
              {ticketLine(a.payment, ticket, money)}
            </p>
          )}
          {a.counter && (
            <p className="text-sm text-fg-muted">
              {text.collected
                .replace("{method}", t.methods[a.counter.method])
                .replace("{amount}", money(a.counter.amountMinor))}
            </p>
          )}
          {a.notes && <p className="text-sm text-fg-muted">{a.notes}</p>}
          {a.customer?.phone && (
            <Link
              href={`tel:${a.customer.phone}`}
              className="inline-flex min-h-11 w-fit items-center gap-1.5 text-sm text-fg-muted underline-offset-2 hover:underline"
            >
              <Phone size={14} aria-hidden="true" />
              {a.customer.phone}
            </Link>
          )}
        </div>
        {actions}
        {moving && !pending && (
          <div className="@4xl:col-span-2">
            <RescheduleForm
              appointment={a}
              t={t}
              onMoved={(date) => {
                setMoving(false);
                onMoved(date);
              }}
            />
          </div>
        )}
      </div>
    </li>
  );
}
