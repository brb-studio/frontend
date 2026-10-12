"use client";

import { useQuery } from "@tanstack/react-query";
import { Copy, Landmark, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetActions } from "@/features/payments/sheet";
import type { Dictionary } from "@/shared/i18n/en";
import type { Locale } from "@/shared/i18n/locales";
import { formatMoney } from "@/shared/i18n/money";
import { Button, ButtonLink } from "@/shared/ui/button";
import { createTransfer, type Transfer } from "./actions";

const transferQuery = (appointmentId: string, paymentToken?: string) => ({
  queryKey: ["payment-transfer", appointmentId],
  queryFn: () => createTransfer(appointmentId, paymentToken),
  staleTime: Number.POSITIVE_INFINITY,
  retry: false,
});

function CopyButton({ text, t }: { text: string; t: Dictionary["booking"] }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard
          .writeText(text)
          .then(() => setCopied(true))
          .catch(() => {});
      }}
      className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line px-3 text-sm transition-colors hover:border-accent"
    >
      <Copy size={14} aria-hidden="true" className="text-accent" />
      {copied ? t.copied : t.copy}
    </button>
  );
}

function TransferDetails({
  lang,
  transfer,
  signedInCustomer,
  onClose,
  t,
}: {
  lang: Locale;
  transfer: Transfer;
  signedInCustomer: boolean;
  onClose: () => void;
  t: Dictionary["booking"];
}) {
  const rows = [
    { label: t.transferHolder, value: transfer.holder },
    { label: t.transferClabe, value: transfer.clabe, copy: true },
    {
      label: t.transferAmount,
      value: formatMoney(transfer.amountMinor, transfer.currency, lang),
    },
  ];
  const until = new Intl.DateTimeFormat(lang, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(transfer.expiresAt));
  return (
    <div className="grid gap-4">
      <p className="text-sm text-fg-muted">{t.transferLead}</p>
      <dl className="grid gap-3">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-line bg-surface px-4 py-3"
          >
            <div className="grid min-w-0">
              <dt className="text-xs text-fg-muted">{row.label}</dt>
              <dd className="font-medium break-all tabular-nums">
                {row.value}
              </dd>
            </div>
            {row.copy && <CopyButton text={row.value} t={t} />}
          </div>
        ))}
      </dl>
      <p className="text-xs text-fg-muted">
        {t.transferExpires.replace("{date}", until)}
      </p>
      <p role="status" className="text-sm">
        {t.transferPending}
      </p>
      <SheetActions>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(9rem,1fr))] gap-2">
          <Button variant="secondary" onClick={onClose}>
            {t.close}
          </Button>
          {signedInCustomer && (
            <ButtonLink variant="secondary" href={`/${lang}/account`}>
              {t.seeVisits}
            </ButtonLink>
          )}
        </div>
      </SheetActions>
    </div>
  );
}

export function PayByTransfer({
  lang,
  appointmentId,
  paymentToken,
  amountMinor,
  currency,
  signedInCustomer,
  t,
}: {
  lang: Locale;
  appointmentId: string;
  paymentToken?: string;
  amountMinor: number;
  currency: string;
  signedInCustomer: boolean;
  t: Dictionary["booking"];
}) {
  const [dismissed, setDismissed] = useState(false);
  const [open, setOpen] = useState(true);
  const transfer = useQuery(transferQuery(appointmentId, paymentToken));

  if (dismissed) return null;

  const result = transfer.data;
  const failure =
    result !== undefined && !result.ok && result.error === "alreadyPaid"
      ? "alreadyPaid"
      : "payUnavailable";

  return (
    <div className="grid justify-items-center gap-2">
      <Button onClick={() => setOpen(true)} className="min-w-56">
        <Landmark size={18} aria-hidden="true" />
        {t.payTransfer}
      </Button>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="text-sm font-medium text-fg-muted underline underline-offset-2 hover:text-fg"
      >
        {t.payAtBranch}
      </button>

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title={t.payTransfer}
        icon={
          <Landmark
            size={18}
            aria-hidden="true"
            className="shrink-0 text-accent"
          />
        }
        aside={
          <span className="font-medium">
            {formatMoney(amountMinor, currency, lang)}
          </span>
        }
        closeLabel={t.close}
      >
        {transfer.isPending ? (
          <p
            role="status"
            className="flex items-center gap-2 py-2 text-sm text-fg-muted"
          >
            <LoaderCircle
              size={16}
              aria-hidden="true"
              className="animate-spin"
            />
            {t.payPreparing}
          </p>
        ) : result?.ok === true ? (
          <TransferDetails
            lang={lang}
            transfer={result.transfer}
            signedInCustomer={signedInCustomer}
            onClose={() => setOpen(false)}
            t={t}
          />
        ) : (
          <>
            <p className="text-sm text-fg-muted">{t[failure]}</p>
            <SheetActions>
              <Button variant="secondary" onClick={() => setDismissed(true)}>
                {t.payAtBranch}
              </Button>
            </SheetActions>
          </>
        )}
      </Sheet>
    </div>
  );
}
