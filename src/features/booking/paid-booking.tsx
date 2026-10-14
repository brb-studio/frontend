"use client";

import { useQuery } from "@tanstack/react-query";
import { Check, Clock, CreditCard } from "lucide-react";
import { useState } from "react";
import { PaymentCheckout } from "@/features/payments/checkout";
import {
  type Checkout,
  checkoutQuery,
  type OnlineMethod,
} from "@/features/payments/model";
import { Sheet } from "@/features/payments/sheet";
import type { Dictionary } from "@/shared/i18n/en";
import type { Locale } from "@/shared/i18n/locales";
import { formatMoney } from "@/shared/i18n/money";
import { Button, ButtonLink } from "@/shared/ui/button";

/**
 * After booking with an online payment: the payment sheet opens right away; behind it, the booking's
 * state (held until the deadline, or confirmed once Stripe says it's paid) with a way back to paying.
 */
export function PaidBooking({
  lang,
  checkout,
  publishableKey,
  methods,
  summary,
  t,
  tp,
}: {
  lang: Locale;
  checkout: Checkout;
  publishableKey?: string;
  methods: OnlineMethod[];
  summary: { item: string; barber: string; when: string };
  t: Dictionary["booking"];
  tp: Dictionary["payment"];
}) {
  const [open, setOpen] = useState(true);
  const live = useQuery({
    ...checkoutQuery(checkout.appointmentId),
    initialData: checkout,
  }).data;
  const paid = live.status === "paid" && live.appointmentStatus === "confirmed";
  const ended = live.appointmentStatus === "cancelled";
  const money = (minor: number) => formatMoney(minor, live.currency, lang);
  const deadline = new Intl.DateTimeFormat(lang, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(live.deadline));

  return (
    <section
      role="status"
      className="grid animate-rise justify-items-center gap-3 rounded-[2rem] border border-line bg-card p-8 text-center shadow-soft"
    >
      <span className="grid size-16 place-items-center rounded-full bg-accent text-accent-fg shadow-glow">
        {paid ? (
          <Check size={28} aria-hidden="true" />
        ) : (
          <Clock size={28} aria-hidden="true" />
        )}
      </span>
      <h2 className="text-2xl font-medium">
        {paid ? t.confirmedTitle : ended ? tp.expiredTitle : tp.title}
      </h2>
      <p className="font-medium">
        {summary.item} · {summary.barber}
      </p>
      <p className="text-fg-muted">{summary.when}</p>
      {paid ? (
        <p className="text-sm">
          {tp.paid}: {money(live.amountMinor)}
          {live.balanceMinor > 0 && (
            <>
              {" "}
              · {tp.left}: {money(live.balanceMinor)}
            </>
          )}
        </p>
      ) : ended ? (
        <p className="text-sm text-fg-muted">{tp.expiredLead}</p>
      ) : (
        <>
          <p className="text-sm text-fg-muted">
            {tp.payBefore.replace("{time}", deadline)}
          </p>
          <Button onClick={() => setOpen(true)} className="min-w-56">
            <CreditCard size={18} aria-hidden="true" />
            {tp.completePayment} · {money(live.amountMinor)}
          </Button>
        </>
      )}
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        <ButtonLink variant="secondary" href={`/${lang}/account`}>
          {t.seeVisits}
        </ButtonLink>
        <ButtonLink href={`/${lang}/home`}>{t.home}</ButtonLink>
      </div>

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title={tp.title}
        icon={
          <CreditCard
            size={18}
            aria-hidden="true"
            className="shrink-0 text-accent"
          />
        }
        aside={<span className="font-medium">{money(live.amountMinor)}</span>}
        closeLabel={t.close}
      >
        <PaymentCheckout
          appointmentId={checkout.appointmentId}
          initial={checkout}
          publishableKey={publishableKey}
          methods={methods}
          lang={lang}
          t={tp}
          bookAgainHref={`/${lang}/services`}
        />
      </Sheet>
    </section>
  );
}
