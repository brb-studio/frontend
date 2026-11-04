"use client";

import { type FormEvent, useState } from "react";
import { Button } from "@/shared/ui/button";
import { Field } from "@/shared/ui/field";
import { ActiveSwitch } from "./admin-kit";
import { useAdminAction } from "./api";
import { type AdminText, Result } from "./ui";

type Invoicing = {
  enabled: boolean;
  rfc?: string;
  legalName?: string;
  taxRegime?: string;
  postalCode?: string;
};

const FIELDS = ["rfc", "legalName", "taxRegime", "postalCode"] as const;

function SwitchRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (on: boolean) => void;
}) {
  return (
    <div className="grid gap-1 rounded-2xl border border-line p-4">
      <ActiveSwitch label={label} checked={checked} onChange={onChange} />
      <p className="text-sm text-fg-muted">{hint}</p>
    </div>
  );
}

/** VAT and invoicing; the issuer's details only show while invoicing is on. */
export function FiscalForm({
  iva,
  invoicing,
  t,
  onSaved,
}: {
  iva: boolean;
  invoicing?: Invoicing;
  t: AdminText;
  onSaved: (message: string) => void;
}) {
  const text = t.settings.fiscal;
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
      FIELDS.map((key) => {
        const raw = String(form.get(key) ?? "").trim();
        return [key, key === "rfc" ? raw.toUpperCase() : raw];
      }),
    );
    const filled = Object.values(typed).some(Boolean);
    const data = filled ? typed : saved;
    const complete = Object.values(data).every(Boolean);
    action.mutate(
      {
        method: "PATCH",
        path: "tenant",
        body: {
          iva: { enabled: ivaOn },
          ...((complete || invoicesOn) && {
            invoicing: { enabled: invoicesOn, ...data },
          }),
        },
      },
      {
        onSuccess: (result) => {
          if (result.ok) onSaved(t.settings.fiscalSaved);
        },
      },
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <div className="grid gap-3 md:grid-cols-2">
        <SwitchRow
          label={text.iva}
          hint={text.ivaHint}
          checked={ivaOn}
          onChange={setIvaOn}
        />
        <SwitchRow
          label={text.invoicing}
          hint={text.invoicingHint}
          checked={invoicesOn}
          onChange={setInvoicesOn}
        />
      </div>
      {invoicesOn && (
        <fieldset className="grid gap-3">
          <legend className="mb-1 grid gap-0.5">
            <span className="font-medium">{t.settings.fiscalData}</span>
            <span className="text-sm text-fg-muted">
              {t.settings.fiscalDataHint}
            </span>
          </legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              name="rfc"
              label={text.rfc}
              maxLength={13}
              autoCapitalize="characters"
              className="[&_input]:uppercase"
              required
              defaultValue={saved.rfc}
            />
            <Field
              name="legalName"
              label={text.legalName}
              maxLength={200}
              required
              defaultValue={saved.legalName}
            />
            <Field
              name="taxRegime"
              label={text.taxRegime}
              inputMode="numeric"
              pattern="\d{3}"
              maxLength={3}
              required
              defaultValue={saved.taxRegime}
            />
            <Field
              name="postalCode"
              label={text.postalCode}
              inputMode="numeric"
              pattern="\d{5}"
              maxLength={5}
              required
              defaultValue={saved.postalCode}
            />
          </div>
        </fieldset>
      )}
      {action.data && !action.data.ok && (
        <Result result={action.data} t={t.common} />
      )}
      <div>
        <Button type="submit" disabled={action.isPending}>
          {t.common.save}
        </Button>
      </div>
    </form>
  );
}
