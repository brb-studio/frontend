"use client";

import { Check, Undo2, X } from "lucide-react";
import { type FormEvent, useState } from "react";
import type { Locale } from "@/shared/i18n/locales";
import { formatMoney, toMinor } from "@/shared/i18n/money";
import { Button } from "@/shared/ui/button";
import { Field } from "@/shared/ui/field";
import { FormAlert } from "@/shared/ui/form";
import { Select } from "@/shared/ui/select";
import type { useAdminAction } from "./api";
import { type CashDay, COUNTER_METHODS } from "./schemas";
import { type AdminText, pill, Result, smallButton } from "./ui";

type Action = ReturnType<typeof useAdminAction>;
type Entry = CashDay["entries"][number];

export function EntryForm({
  kind,
  branches,
  currency,
  t,
  action,
  onClose,
  onSaved,
}: {
  kind: "expense" | "adjustment";
  branches: { id: string; name: string }[];
  currency: string;
  t: AdminText;
  action: Action;
  onClose: () => void;
  onSaved: () => void;
}) {
  const text = t.cash;
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const get = (key: string) => String(form.get(key) ?? "").trim();
    const amountMinor = toMinor(get("amount"), currency);
    if (!amountMinor) return setError(text.badAmount);
    setError("");
    action.mutate(
      {
        method: "POST",
        path: "money/entries",
        body: {
          type: kind,
          ...(kind === "adjustment" && { direction: get("direction") }),
          amountMinor,
          method: get("method"),
          branchId: get("branchId") || branches[0]?.id,
          concept: get("concept"),
          ...(get("note") && { note: get("note") }),
          ...(get("reference") && { reference: get("reference") }),
        },
      },
      { onSuccess: (result) => result.ok && onSaved() },
    );
  }

  return (
    <form
      onSubmit={submit}
      className="grid gap-4 rounded-[1.75rem] border border-line-strong bg-card p-5"
    >
      <h2 className="text-lg font-medium">
        {kind === "expense" ? text.newExpense : text.newAdjustment}
      </h2>
      {kind === "adjustment" && (
        <fieldset className="flex flex-wrap gap-2">
          <legend className="mb-2 text-sm font-medium">{text.direction}</legend>
          {(["in", "out"] as const).map((d) => (
            <label key={d} className={pill}>
              <input
                type="radio"
                name="direction"
                value={d}
                defaultChecked={d === "in"}
                className="sr-only"
              />
              {text[d]}
            </label>
          ))}
        </fieldset>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="concept" label={text.concept} required maxLength={120} />
        <Field
          name="amount"
          label={text.amount}
          required
          inputMode="decimal"
          autoComplete="off"
        />
        <Select name="method" label={text.method} defaultValue="cash">
          {COUNTER_METHODS.map((m) => (
            <option key={m} value={m}>
              {t.methods[m]}
            </option>
          ))}
        </Select>
        {branches.length > 1 && (
          <Select name="branchId" label={text.branch}>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
        )}
        <Field
          name="note"
          label={text.note}
          required={kind === "adjustment"}
          maxLength={500}
          {...(kind === "adjustment" && { hint: text.noteRequired })}
        />
        <Field
          name="reference"
          label={text.referenceOptional}
          maxLength={120}
        />
      </div>
      {error && <FormAlert>{error}</FormAlert>}
      <Result result={action.data} t={t.common} />
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          {t.common.close}
        </Button>
        <Button type="submit" disabled={action.isPending}>
          <Check size={18} aria-hidden="true" />
          {t.common.save}
        </Button>
      </div>
    </form>
  );
}

export function EntryActions({
  entry,
  locale,
  currency,
  t,
  action,
}: {
  entry: Entry;
  locale: Locale;
  currency: string;
  t: AdminText;
  action: Action;
}) {
  const text = t.cash;
  const [open, setOpen] = useState<"reverse" | "return" | null>(null);
  const [note, setNote] = useState("");
  const [reference, setReference] = useState("");
  const canReverse = !entry.reversed && !entry.reverses;
  const canReturn =
    entry.direction === "in" &&
    entry.type === "service_payment" &&
    (entry.channel === "spei" || entry.channel === "online") &&
    entry.appointmentId !== undefined;
  if (!canReverse && !canReturn) return null;

  const done = { onSuccess: () => setOpen(null) };

  if (open === "reverse") {
    return (
      <div className="grid gap-3 sm:col-span-2">
        <Field
          name="why"
          label={text.reverseWhy}
          hint={text.reverseHint}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={500}
        />
        <Result result={action.data} t={t.common} />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={smallButton}
            onClick={() => setOpen(null)}
          >
            <X size={16} aria-hidden="true" />
            {t.common.close}
          </button>
          <button
            type="button"
            className={smallButton}
            disabled={!note.trim() || action.isPending}
            onClick={() =>
              action.mutate(
                {
                  method: "POST",
                  path: "money/entries",
                  body: {
                    type: "adjustment",
                    reverses: entry.id,
                    note: note.trim(),
                  },
                },
                done,
              )
            }
          >
            <Undo2 size={16} aria-hidden="true" />
            {text.reverse}
          </button>
        </div>
      </div>
    );
  }

  if (open === "return") {
    const spei = entry.channel === "spei";
    return (
      <div className="grid gap-3 sm:col-span-2">
        <p className="text-fg-muted">
          {spei ? text.returnSpei : text.returnOnline}
        </p>
        {spei && (
          <Field
            name="returnReference"
            label={text.referenceOptional}
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            maxLength={120}
          />
        )}
        <Result result={action.data} t={t.common} />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={smallButton}
            onClick={() => setOpen(null)}
          >
            <X size={16} aria-hidden="true" />
            {t.common.close}
          </button>
          <button
            type="button"
            className={smallButton}
            disabled={action.isPending}
            onClick={() =>
              action.mutate(
                {
                  method: "POST",
                  path: `payments/appointments/${entry.appointmentId}/refund`,
                  body:
                    spei && reference.trim()
                      ? { reference: reference.trim() }
                      : {},
                },
                done,
              )
            }
          >
            <Undo2 size={16} aria-hidden="true" />
            {text.returnMoney} ·{" "}
            {formatMoney(entry.amountMinor, currency, locale)}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2 pt-1 sm:col-span-2">
      {canReturn && (
        <button
          type="button"
          className={smallButton}
          onClick={() => setOpen("return")}
        >
          <Undo2 size={16} aria-hidden="true" />
          {text.returnMoney}
        </button>
      )}
      {canReverse && (
        <button
          type="button"
          className={smallButton}
          onClick={() => setOpen("reverse")}
        >
          <Undo2 size={16} aria-hidden="true" />
          {text.reverse}
        </button>
      )}
    </div>
  );
}
