"use client";

import { useQuery } from "@tanstack/react-query";
import { Check, CreditCard, LoaderCircle, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { Dictionary } from "@/shared/i18n/en";
import type { Locale } from "@/shared/i18n/locales";
import { formatMoney } from "@/shared/i18n/money";
import { Button, ButtonLink } from "@/shared/ui/button";
import { createPaymentIntent } from "./actions";
import { PaymentForm } from "./payment-form";

const intentQuery = (appointmentId: string) => ({
  queryKey: ["payment-intent", appointmentId],
  queryFn: () => createPaymentIntent(appointmentId),
  staleTime: Number.POSITIVE_INFINITY,
  retry: false,
});

export function PayOnline({
  lang,
  appointmentId,
  amountMinor,
  currency,
  signedInCustomer,
  t,
}: {
  lang: Locale;
  appointmentId: string;
  amountMinor: number;
  currency: string;
  signedInCustomer: boolean;
  t: Dictionary["booking"];
}) {
  const [dismissed, setDismissed] = useState(false);
  const [open, setOpen] = useState(false);
  const [paid, setPaid] = useState(false);
  const [mounted, setMounted] = useState(false);
  const intent = useQuery(intentQuery(appointmentId));

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

  const result = intent.data;
  const failure =
    result !== undefined && !result.ok && result.error === "alreadyPaid"
      ? "alreadyPaid"
      : "payUnavailable";

  const handlePaid = () => {
    setOpen(false);
    setPaid(true);
  };

  return (
    <div className="grid justify-items-center gap-2">
      {paid ? (
        <div
          role="status"
          className="grid animate-rise justify-items-center gap-3"
        >
          <span className="grid size-12 place-items-center rounded-full bg-accent text-accent-fg shadow-glow">
            <Check size={24} aria-hidden="true" />
          </span>
          <p className="font-medium">{t.paySucceeded}</p>
          {signedInCustomer && (
            <ButtonLink variant="secondary" href={`/${lang}/account`}>
              {t.seeVisits}
            </ButtonLink>
          )}
        </div>
      ) : (
        <>
          <Button onClick={() => setOpen(true)} className="min-w-56">
            <CreditCard size={18} aria-hidden="true" />
            {t.payOnline}
          </Button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="text-sm font-medium text-fg-muted underline underline-offset-2 hover:text-fg"
          >
            {t.payAtBranch}
          </button>
        </>
      )}

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
                    <CreditCard
                      size={18}
                      aria-hidden="true"
                      className="shrink-0 text-accent-text"
                    />
                    <span id="pay-sheet-title" className="truncate">
                      {t.payOnline}
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
                      className="grid size-10 place-items-center rounded-full border border-line bg-surface transition-colors hover:border-accent-text"
                    >
                      <X size={18} aria-hidden="true" />
                    </button>
                  </p>
                </div>
              </header>
              <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
                {open &&
                  (intent.isPending ? (
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
                    <PaymentForm
                      lang={lang}
                      intent={result.intent}
                      onPaid={handlePaid}
                      onPayAtBranch={() => setDismissed(true)}
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
