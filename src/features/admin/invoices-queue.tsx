"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import * as z from "zod";
import type { Locale } from "@/shared/i18n/locales";
import { formatMoney } from "@/shared/i18n/money";
import { Button } from "@/shared/ui/button";
import { Field } from "@/shared/ui/field";
import { adminQuery, useAdminAction } from "./api";
import { invoiceSchema } from "./schemas";
import { type AdminText, Panel, Result } from "./ui";

const invoicesQuery = adminQuery("invoices", z.array(invoiceSchema));

export function InvoicesQueue({ t, locale }: { t: AdminText; locale: Locale }) {
  const invoices = useQuery(invoicesQuery);
  const action = useAdminAction();
  const [uuids, setUuids] = useState<Record<string, string>>({});
  const text = t.settings.invoices;

  return (
    <Panel title={text.title}>
      {invoices.data && invoices.data.length === 0 && (
        <p className="text-sm text-fg-muted">{text.empty}</p>
      )}
      {invoices.data && invoices.data.length > 0 && (
        <ul className="grid gap-3">
          {invoices.data.map((invoice) => (
            <li
              key={invoice.id}
              className="grid gap-2 rounded-2xl border border-line p-4 text-sm"
            >
              <p className="font-medium">
                {invoice.receiver.legalName} · {invoice.receiver.rfc}
              </p>
              <p className="text-fg-muted">
                {formatMoney(invoice.amountMinor, invoice.currency, locale)} ·{" "}
                {text[invoice.status]} ·{" "}
                {new Date(invoice.createdAt).toLocaleDateString(locale)}
              </p>
              <p className="text-fg-muted">
                {invoice.receiver.taxRegime} · CP {invoice.receiver.postalCode}{" "}
                · {invoice.receiver.cfdiUse}
              </p>
              {invoice.status === "requested" && (
                <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto] sm:items-end">
                  <Field
                    name={`uuid-${invoice.id}`}
                    label={text.uuid}
                    value={uuids[invoice.id] ?? ""}
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
      <Result result={action.data} t={t.common} />
    </Panel>
  );
}
