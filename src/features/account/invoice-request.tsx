"use client";

import { FileText } from "lucide-react";
import { type FormEvent, useState } from "react";
import type { Dictionary } from "@/shared/i18n/en";
import { Button } from "@/shared/ui/button";
import { Field } from "@/shared/ui/field";
import { FormAlert } from "@/shared/ui/form";

export function InvoiceRequest({
  appointmentId,
  t,
}: {
  appointmentId: string;
  t: Dictionary["account"]["invoice"];
}) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<"idle" | "pending" | "sent" | "error">(
    "idle",
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("pending");
    const body = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const response = await fetch(
        `/api/me/appointments/${appointmentId}/invoice`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      setState(response.ok ? "sent" : "error");
    } catch {
      setState("error");
    }
  }

  if (state === "sent") {
    return (
      <p role="status" className="text-sm text-accent-text">
        {t.sent}
      </p>
    );
  }

  return (
    <div className="grid gap-3 border-t border-line pt-2">
      <Button
        type="button"
        variant="secondary"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="justify-self-start"
      >
        <FileText size={16} aria-hidden="true" />
        {t.title}
      </Button>
      {open && (
        <form onSubmit={submit} noValidate className="grid gap-3">
          <p className="text-sm text-fg-muted">{t.lead}</p>
          <Field name="rfc" label={t.rfc} required maxLength={13} />
          <Field
            name="legalName"
            label={t.legalName}
            required
            maxLength={200}
          />
          <Field
            name="taxRegime"
            label={t.taxRegime}
            required
            inputMode="numeric"
            pattern="\d{3}"
          />
          <Field
            name="postalCode"
            label={t.postalCode}
            required
            inputMode="numeric"
            pattern="\d{5}"
          />
          <label className="grid gap-2 text-sm font-medium">
            {t.cfdiUse}
            <select
              name="cfdiUse"
              defaultValue="G03"
              className="h-13 rounded-2xl border border-line-strong bg-surface px-4 text-fg font-normal"
            >
              <option value="G03">{t.cfdiGeneral}</option>
              <option value="P01">{t.cfdiUndefined}</option>
            </select>
          </label>
          {state === "error" && <FormAlert>{t.error}</FormAlert>}
          <Button type="submit" disabled={state === "pending"}>
            {t.submit}
          </Button>
        </form>
      )}
    </div>
  );
}
