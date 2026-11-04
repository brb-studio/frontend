"use client";

import { useQuery } from "@tanstack/react-query";
import { FileText } from "lucide-react";
import { useState } from "react";
import * as z from "zod";
import type { Locale } from "@/shared/i18n/locales";
import { formatMoney } from "@/shared/i18n/money";
import { Button } from "@/shared/ui/button";
import { Field } from "@/shared/ui/field";
import { Section } from "./admin-kit";
import { adminQuery, useAdminAction } from "./api";
import { invoiceSchema } from "./schemas";
import { type AdminText, Result } from "./ui";

const invoicesQuery = adminQuery("invoices", z.array(invoiceSchema));

const STATUS_CLASS = {
  requested: "bg-accent text-accent-fg",
  issued: "border border-line text-fg-muted",
  cancelled: "border border-line text-fg-muted line-through",
} as const;

export function InvoicesQueue({ t, locale }: { t: AdminText; locale: Locale }) {
  const invoices = useQuery(invoicesQuery);
  const action = useAdminAction();
  const [uuids, setUuids] = useState<Record<string, string>>({});
  const text = t.settings.invoices;
  const rows = invoices.data ?? [];
  const pending = rows.filter((i) => i.status === "requested").length;

  return (
    <Section
      icon={FileText}
      title={text.title}
      aside={
        pending > 0 && (
          <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs text-accent-fg">
            {t.settings.pendingInvoices.replace("{n}", String(pending))}
          </span>
        )
      }
    >
      {invoices.isPending ? (
        <p className="text-sm text-fg-muted">{t.common.loading}</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-fg-muted">{text.empty}</p>
      ) : (
        <ul className="grid gap-3">
          {rows.map((invoice) => (
            <li
              key={invoice.id}
              className={`grid gap-2 rounded-2xl border p-4 text-sm ${invoice.status === "requested" ? "border-accent" : "border-line"}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="grid gap-0.5">
                  <p className="font-medium">{invoice.receiver.legalName}</p>
                  <p className="text-fg-muted">{invoice.receiver.rfc}</p>
                </div>
                <div className="grid justify-items-end gap-1">
                  <span className="text-base font-semibold tabular-nums">
                    {formatMoney(invoice.amountMinor, invoice.currency, locale)}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs ${STATUS_CLASS[invoice.status]}`}
                  >
                    {text[invoice.status]}
                  </span>
                </div>
              </div>
              <p className="text-fg-muted">
                {[
                  new Date(invoice.createdAt).toLocaleDateString(locale, {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  }),
                  invoice.receiver.taxRegime,
                  `CP ${invoice.receiver.postalCode}`,
                  invoice.receiver.cfdiUse,
                ].join(" · ")}
              </p>
              {invoice.status === "requested" && (
                <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto] sm:items-end">
                  <Field
                    name={`uuid-${invoice.id}`}
                    label={text.uuid}
                    value={uuids[invoice.id] ?? ""}
                    autoComplete="off"
                    onChange={(event) =>
                      setUuids((current) => ({
                        ...current,
                        [invoice.id]: event.target.value.trim(),
                      }))
                    }
                  />
                  <Button
                    type="button"
                    disabled={!uuids[invoice.id] || action.isPending}
                    onClick={() =>
                      action.mutate({
                        method: "PATCH",
                        path: `invoices/${invoice.id}`,
                        body: {
                          status: "issued",
                          cfdiUuid: uuids[invoice.id],
                        },
                      })
                    }
                  >
                    {text.issue}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={action.isPending}
                    onClick={() =>
                      action.mutate({
                        method: "PATCH",
                        path: `invoices/${invoice.id}`,
                        body: { status: "cancelled" },
                      })
                    }
                  >
                    {text.cancel}
                  </Button>
                </div>
              )}
              {invoice.cfdiUuid && (
                <p className="break-all text-xs text-fg-muted">
                  {text.uuid}: {invoice.cfdiUuid}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
      {action.data && !action.data.ok && (
        <Result result={action.data} t={t.common} />
      )}
    </Section>
  );
}
