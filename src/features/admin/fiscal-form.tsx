"use client";

import { type FormEvent, useState } from "react";
import { Button } from "@/shared/ui/button";
import { Field } from "@/shared/ui/field";
import { useAdminAction } from "./api";
import { type AdminText, Panel, Result, Toggle } from "./ui";

type Invoicing = {
  enabled: boolean;
  rfc?: string;
  legalName?: string;
  taxRegime?: string;
  postalCode?: string;
};

const FIELDS = ["rfc", "legalName", "taxRegime", "postalCode"] as const;

export function FiscalForm({
  iva,
  invoicing,
  t,
}: {
  iva: boolean;
  invoicing?: Invoicing;
  t: AdminText;
}) {
  const action = useAdminAction();
  const [ivaOn, setIvaOn] = useState(iva);
  const [invoicesOn, setInvoicesOn] = useState(invoicing?.enabled ?? false);
  const saved = {
    rfc: invoicing?.rfc ?? "",
    legalName: invoicing?.legalName ?? "",
    taxRegime: invoicing?.taxRegime ?? "",
    postalCode: invoicing?.postalCode ?? "",
  };

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const typed = Object.fromEntries(
      FIELDS.map((key) => [key, String(form.get(key) ?? "").trim()]),
    );
    const filled = Object.values(typed).some(Boolean);
    const data = filled ? typed : saved;
    const complete = Object.values(data).every(Boolean);
    action.mutate({
      method: "PATCH",
      path: "tenant",
      body: {
        iva: { enabled: ivaOn },
        ...((complete || invoicesOn) && {
          invoicing: { enabled: invoicesOn, ...data },
        }),
      },
    });
  }

  return (
    <Panel title={t.settings.fiscal.title}>
      <form onSubmit={submit} className="grid gap-4">
        <div className="grid gap-1">
          <Toggle
            label={t.settings.fiscal.iva}
            checked={ivaOn}
            onChange={setIvaOn}
          />
          <p className="text-xs text-fg-muted">{t.settings.fiscal.ivaHint}</p>
        </div>
        <div className="grid gap-1">
          <Toggle
            label={t.settings.fiscal.invoicing}
            checked={invoicesOn}
            onChange={setInvoicesOn}
          />
          <p className="text-xs text-fg-muted">
            {t.settings.fiscal.invoicingHint}
          </p>
        </div>
        <Field
          name="rfc"
          label={t.settings.fiscal.rfc}
          maxLength={13}
          defaultValue={saved.rfc}
        />
        <Field
          name="legalName"
          label={t.settings.fiscal.legalName}
          maxLength={200}
          defaultValue={saved.legalName}
        />
        <Field
          name="taxRegime"
          label={t.settings.fiscal.taxRegime}
          inputMode="numeric"
          maxLength={3}
          defaultValue={saved.taxRegime}
        />
        <Field
          name="postalCode"
          label={t.settings.fiscal.postalCode}
          inputMode="numeric"
          maxLength={5}
          defaultValue={saved.postalCode}
        />
        <Result result={action.data} t={t.common} />
        <Button type="submit" disabled={action.isPending}>
          {t.common.save}
        </Button>
      </form>
    </Panel>
  );
}
