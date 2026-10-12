"use client";

import { CreditCard, Landmark } from "lucide-react";
import { useId, useState } from "react";
import type { Dictionary } from "@/shared/i18n/en";
import type { Locale } from "@/shared/i18n/locales";
import { formatMoney } from "@/shared/i18n/money";
import { Button } from "@/shared/ui/button";
import {
  type OnlineMethod,
  type OnlinePayments,
  type OnlineQuote,
  type PaymentKind,
  transferFits,
} from "./model";
import { SheetActions } from "./sheet";

const option =
  "relative flex cursor-pointer items-start gap-3 rounded-2xl border border-line bg-surface px-4 py-3 text-sm transition-colors hover:border-accent has-checked:border-accent has-checked:ring-2 has-checked:ring-accent has-disabled:cursor-not-allowed has-disabled:opacity-50 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent";

export type PaymentPick = { kind: PaymentKind; method: OnlineMethod };

/**
 * How much (deposit or full) and how (card or transfer). Every amount comes from the API's quote
 * (promotion applied, the charge and what a timely cancellation refunds), never from the browser.
 * Without a required deposit the customer may also book without paying.
 */
export function PaymentChoice({
  quote,
  currency,
  startAt,
  online,
  cards,
  pending,
  lang,
  summary,
  t,
  onPay,
  onSkip,
}: {
  quote: OnlineQuote;
  currency: string;
  startAt: string;
  online: OnlinePayments;
  /** Card payments need the publishable key; without it only transfers are offered. */
  cards: boolean;
  pending: boolean;
  lang: Locale;
  summary: { item: string; barber: string; when: string };
  t: Dictionary["payment"];
  onPay: (pick: PaymentPick) => void;
  onSkip?: () => void;
}) {
  const offersTransfer = quote.options.some(
    (o) => o.method === "bank_transfer",
  );
  const canTransfer = offersTransfer && transferFits(startAt, online);
  const [kind, setKind] = useState<PaymentKind>(
    quote.depositMinor !== undefined ? "deposit" : "full",
  );
  const [method, setMethod] = useState<OnlineMethod>(
    cards ? "card" : "bank_transfer",
  );
  const money = (minor: number) => formatMoney(minor, currency, lang);
  const formId = useId();
  const chosen: OnlineMethod =
    method === "bank_transfer" && !canTransfer ? "card" : method;
  const picked =
    quote.options.find((o) => o.kind === kind && o.method === chosen) ??
    quote.options.find((o) => o.kind === kind);
  const toPay = picked?.amountMinor ?? quote.fullMinor;

  return (
    <form
      id={formId}
      onSubmit={(event) => {
        event.preventDefault();
        // The sheet is portaled but still inside the booking form in React's tree: keep this
        // submit from also submitting (and resetting) the booking.
        event.stopPropagation();
        onPay({ kind, method: chosen });
      }}
      className="grid gap-5"
    >
      <p className="grid gap-0.5 text-sm">
        <span className="font-medium">
          {summary.item} · {summary.barber}
        </span>
        <span className="text-fg-muted">{summary.when}</span>
      </p>

      {quote.depositMinor !== undefined && (
        <fieldset className="grid gap-2">
          <legend className="mb-1 text-sm font-medium text-fg-muted">
            {t.howMuch}
          </legend>
          <label className={option}>
            <input
              type="radio"
              name="kind"
              className="sr-only"
              checked={kind === "deposit"}
              onChange={() => setKind("deposit")}
            />
            <span className="grid gap-0.5">
              <span className="font-medium">
                {t.deposit} · {money(quote.depositMinor)}
              </span>
              <span className="text-fg-muted">
                {t.depositNote.replace(
                  "{amount}",
                  money(quote.fullMinor - quote.depositMinor),
                )}
              </span>
            </span>
          </label>
          <label className={option}>
            <input
              type="radio"
              name="kind"
              className="sr-only"
              checked={kind === "full"}
              onChange={() => setKind("full")}
            />
            <span className="font-medium">
              {t.full} · {money(quote.fullMinor)}
            </span>
          </label>
        </fieldset>
      )}

      <fieldset className="grid gap-2">
        <legend className="mb-1 text-sm font-medium text-fg-muted">
          {t.how}
        </legend>
        {cards && (
          <label className={option}>
            <input
              type="radio"
              name="method"
              className="sr-only"
              checked={chosen === "card"}
              onChange={() => setMethod("card")}
            />
            <CreditCard
              size={18}
              aria-hidden="true"
              className="mt-0.5 shrink-0 text-accent"
            />
            <span className="grid gap-0.5">
              <span className="font-medium">{t.card}</span>
              <span className="text-fg-muted">{t.cardHint}</span>
            </span>
          </label>
        )}
        {offersTransfer && (
          <label className={option}>
            <input
              type="radio"
              name="method"
              className="sr-only"
              disabled={!canTransfer}
              checked={chosen === "bank_transfer"}
              onChange={() => setMethod("bank_transfer")}
            />
            <Landmark
              size={18}
              aria-hidden="true"
              className="mt-0.5 shrink-0 text-accent"
            />
            <span className="grid gap-0.5">
              <span className="font-medium">{t.transfer}</span>
              <span className="text-fg-muted">
                {canTransfer ? t.transferHint : t.transferNotOffered}
              </span>
            </span>
          </label>
        )}
      </fieldset>

      <dl className="grid gap-1 rounded-2xl border border-line bg-surface px-4 py-3 text-sm">
        <div className="flex justify-between gap-4 font-medium">
          <dt>{t.toPay}</dt>
          <dd>{money(toPay)}</dd>
        </div>
        {quote.fullMinor > toPay && (
          <div className="flex justify-between gap-4 text-fg-muted">
            <dt>{t.left}</dt>
            <dd>{money(quote.fullMinor - toPay)}</dd>
          </div>
        )}
        {picked && (
          <p className="border-t border-line pt-2 text-xs text-fg-muted">
            {t.refundNote.replace("{amount}", money(picked.refundableMinor))}
          </p>
        )}
      </dl>

      <SheetActions>
        <Button
          type="submit"
          form={formId}
          disabled={pending || (!cards && !canTransfer)}
        >
          {t.continue}
        </Button>
        {!quote.required && onSkip && (
          <button
            type="button"
            onClick={onSkip}
            disabled={pending}
            className="py-1 text-sm font-medium text-fg-muted underline underline-offset-2 hover:text-fg"
          >
            {t.later}
          </button>
        )}
      </SheetActions>
    </form>
  );
}
