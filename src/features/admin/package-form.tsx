"use client";

import { Check } from "lucide-react";
import { type FormEvent, useState } from "react";
import { pick } from "@/shared/i18n/localized";
import { formatMoney, toMajor, toMinor } from "@/shared/i18n/money";
import { Button } from "@/shared/ui/button";
import { useAdminAction } from "./api";
import { CommonInputs, commonFields, FormSection } from "./catalog-inputs";
import { formatDuration, packageTotals } from "./catalog-view";
import type { AdminPackage, AdminService } from "./schemas";
import { type CatalogProps, Preview, PriceField } from "./service-form";
import { Result } from "./ui";

/** New or existing package: its services as tick cards, with length, "separately" price and savings live. */
export function PackageForm({
  pkg,
  services,
  onDone,
  locale,
  currency,
  t,
}: CatalogProps & {
  pkg?: AdminPackage;
  services: AdminService[];
  /** What was saved, in words. */
  onDone: (message: string) => void;
}) {
  const text = t.services;
  const action = useAdminAction();
  const [picked, setPicked] = useState<string[]>(
    pkg?.items.map((item) => item.serviceId) ?? [],
  );
  const [name, setName] = useState(pkg?.name.es ?? "");
  const [description, setDescription] = useState(pkg?.description?.es ?? "");
  const [price, setPrice] = useState(
    pkg ? toMajor(pkg.priceMinor, currency) : "",
  );
  const money = (value: number) => formatMoney(value, currency, locale);
  const words = {
    minutes: text.durationMin,
    hours: text.durationH,
    hoursMinutes: text.durationHM,
  };
  const choices = services.filter(
    (s) => s.active && (!s.branchId || s.branchId === pkg?.branchId),
  );
  const totals = packageTotals(picked, choices);
  const minor = toMinor(price, currency);
  const saves =
    minor !== null && picked.length > 0 ? totals.listPriceMinor - minor : null;
  const length = formatDuration(totals.durationMin, words);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const what = [
      name.trim() || text.untitled,
      length,
      minor !== null ? money(minor) : "",
    ]
      .filter(Boolean)
      .join(" · ");
    action.mutate(
      {
        method: pkg ? "PATCH" : "POST",
        path: pkg ? `packages/${pkg.id}` : "packages",
        body: {
          ...commonFields(form, !pkg),
          priceMinor: minor ?? -1,
          items: picked.map((serviceId) => ({ serviceId })),
        },
      },
      {
        onSuccess: (result) =>
          result.ok &&
          onDone((pkg ? text.saved : text.created).replace("{what}", what)),
      },
    );
  }

  return (
    <form
      onSubmit={submit}
      onChange={(event) => {
        const field = event.target as EventTarget as HTMLInputElement;
        if (field.name === "nameEs") setName(field.value);
        if (field.name === "descriptionEs") setDescription(field.value);
      }}
      className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]"
    >
      <div className="grid min-w-0 gap-6">
        <CommonInputs item={pkg} kind="packages" t={t} />
        <FormSection title={text.sectionServices}>
          <ul className="grid gap-2 sm:grid-cols-2">
            {choices.map((s) => {
              const on = picked.includes(s.id);
              return (
                <li key={s.id}>
                  <label
                    className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border px-3 py-2 text-sm transition-colors ${on ? "border-accent bg-card" : "border-line bg-surface hover:border-accent"}`}
                  >
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={(event) =>
                        setPicked((list) =>
                          event.target.checked
                            ? [...list, s.id]
                            : list.filter((id) => id !== s.id),
                        )
                      }
                      className="sr-only"
                    />
                    <span
                      aria-hidden="true"
                      className={`grid size-6 shrink-0 place-items-center rounded-lg border ${on ? "border-accent bg-accent text-accent-fg" : "border-line-strong"}`}
                    >
                      {on && <Check size={14} />}
                    </span>
                    <span className="grid min-w-0 flex-1">
                      <span className="truncate font-medium">
                        {pick(s.name, locale)}
                      </span>
                      <span className="text-fg-muted">
                        {formatDuration(s.durationMin, words)} ·{" "}
                        {money(s.priceMinor)}
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
          <p
            aria-live="polite"
            className={`text-sm ${picked.length < 2 ? "text-fg-muted" : ""}`}
          >
            {picked.length < 2
              ? text.pickTwo
              : text.separatelyTotal
                  .replace("{amount}", money(totals.listPriceMinor))
                  .replace("{duration}", length)}
          </p>
        </FormSection>
        <FormSection title={text.price}>
          <PriceField
            currency={currency}
            locale={locale}
            label={text.price}
            {...(pkg
              ? { defaultValue: toMajor(pkg.priceMinor, currency) }
              : {})}
            onValue={setPrice}
          />
          {saves !== null && picked.length >= 2 && (
            <p
              className={`text-sm ${saves > 0 ? "font-medium text-accent-text" : "text-fg-muted"}`}
            >
              {saves > 0
                ? text.customerSaves.replace("{amount}", money(saves))
                : text.noSaving}
            </p>
          )}
        </FormSection>
        {action.data && !action.data.ok && (
          <Result result={action.data} t={t.common} />
        )}
        <Button
          type="submit"
          disabled={action.isPending || picked.length < 2}
          className="sm:w-fit"
        >
          {pkg ? t.common.save : text.newPackage}
        </Button>
      </div>
      <Preview
        title={text.preview}
        image={pkg?.image ?? pkg?.images[0]}
        name={name.trim() || text.untitled}
        description={description.trim()}
        meta={picked.length > 0 ? length : "—"}
        price={minor !== null ? money(minor) : "—"}
      />
    </form>
  );
}
