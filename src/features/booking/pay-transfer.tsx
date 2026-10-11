"use client";

import { useQuery } from "@tanstack/react-query";
import { Copy, Landmark, LoaderCircle, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
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
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={onClose}>
          {t.close}
        </Button>
        {signedInCustomer && (
          <ButtonLink variant="secondary" href={`/${lang}/account`}>
            {t.seeVisits}
          </ButtonLink>
        )}
      </div>
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
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const transfer = useQuery(transferQuery(appointmentId, paymentToken));

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) setOpen(true);
  }, [mounted]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", close);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", close);
    };
  }, [open]);

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

      {mounted &&
        createPortal(
          <div
            inert={!open}
            className="fixed inset-0 z-50 flex flex-col justify-end"
          >
            <button
              type="button"
              aria-label={t.close}
              onClick={() => setOpen(false)}
              className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-700 ${open ? "opacity-100" : "opacity-0"}`}
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="pay-sheet-title"
              className={`relative flex h-[60dvh] w-full flex-col rounded-t-[2rem] border border-b-0 border-line bg-sheet text-fg shadow-soft backdrop-blur-2xl transition-[translate,opacity] duration-700 ease-spring ${open ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"}`}
            >
              <header className="shrink-0 px-5 pt-3">
                <span
                  aria-hidden="true"
                  className="mx-auto mb-3 block h-1.5 w-10 rounded-full bg-fg/20"
                />
                <div className="flex items-center justify-between gap-3 border-b border-line pb-3">
                  <p className="flex min-w-0 items-center gap-2 text-base font-medium">
                    <Landmark
                      size={18}
                      aria-hidden="true"
                      className="shrink-0 text-accent"
                    />
                    <span id="pay-sheet-title" className="truncate">
                      {t.payTransfer}
                    </span>
                  </p>
                  <p className="flex shrink-0 items-center gap-3">
                    <span className="font-medium">
                      {formatMoney(amountMinor, currency, lang)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      aria-label={t.close}
                      className="grid size-10 place-items-center rounded-full border border-line bg-surface transition-colors hover:border-accent"
                    >
                      <X size={18} aria-hidden="true" />
                    </button>
                  </p>
                </div>
              </header>
              <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
                {open &&
                  (transfer.isPending ? (
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
                    <div className="grid gap-2">
                      <p className="text-sm text-fg-muted">{t[failure]}</p>
                      <Button
                        variant="secondary"
                        onClick={() => setDismissed(true)}
                      >
                        {t.payAtBranch}
                      </Button>
                    </div>
                  ))}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
