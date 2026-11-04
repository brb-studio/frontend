"use client";

import { Clock, type LucideIcon, Scissors } from "lucide-react";
import Image from "next/image";
import { type FormEvent, useState } from "react";
import type { Locale } from "@/shared/i18n/locales";
import { formatMoney, toMajor, toMinor } from "@/shared/i18n/money";
import { Button } from "@/shared/ui/button";
import { Field } from "@/shared/ui/field";
import { Select } from "@/shared/ui/select";
import { useAdminAction } from "./api";
import { CommonInputs, commonFields, FormSection } from "./catalog-inputs";
import { DURATION_PRESETS, formatDuration } from "./catalog-view";
import type { AdminBranch, AdminService } from "./schemas";
import { type AdminText, pill, Result, value } from "./ui";

export type CatalogProps = { locale: Locale; currency: string; t: AdminText };

/** "Price" with the currency's sign in front, typed as the shop says it ("250" or "250.50"). */
export function PriceField({
  currency,
  locale,
  label,
  defaultValue,
  onValue,
}: {
  currency: string;
  locale: Locale;
  label: string;
  defaultValue?: string;
  onValue?: (text: string) => void;
}) {
  const sign =
    new Intl.NumberFormat(locale, { style: "currency", currency })
      .formatToParts(0)
      .find((part) => part.type === "currency")?.value ?? currency;
  return (
    <Field
      name="price"
      inputMode="decimal"
      label={label}
      required
      defaultValue={defaultValue}
      icon={<span className="text-sm font-medium">{sign}</span>}
      onChange={(event) => onValue?.(event.target.value)}
    />
  );
}

/** How a customer sees the service: photo, name, length and price. */
export function Preview({
  title,
  image,
  name,
  description,
  meta,
  price,
  icon: Icon = Scissors,
  clock = true,
}: {
  title: string;
  image?: string | undefined;
  name: string;
  description: string;
  meta: string;
  price: string;
  /** Shown when there is no photo yet. */
  icon?: LucideIcon;
  /** A service shows its length; a product doesn't have one. */
  clock?: boolean;
}) {
  return (
    <aside className="grid content-start gap-2">
      <p className="text-sm font-medium text-fg-muted">{title}</p>
      <div className="overflow-hidden rounded-3xl border border-line bg-card">
        <div className="relative grid aspect-[4/3] place-items-center bg-surface text-fg-muted">
          {image ? (
            <Image
              src={image}
              alt=""
              fill
              sizes="20rem"
              className="object-cover"
            />
          ) : (
            <Icon size={32} aria-hidden="true" />
          )}
        </div>
        <div className="grid gap-1 p-4 text-sm">
          <p className="text-base font-medium">{name}</p>
          {description && (
            <p className="line-clamp-2 text-fg-muted">{description}</p>
          )}
          <p className="flex items-center justify-between gap-2 pt-1">
            <span className="inline-flex items-center gap-1.5 text-fg-muted">
              {clock && <Clock size={14} aria-hidden="true" />}
              {meta}
            </span>
            <span className="font-semibold tabular-nums">{price}</span>
          </p>
        </div>
      </div>
    </aside>
  );
}

/** New or existing service: photos, name, length (one-tap presets), price, branch (when new), with a live preview. */
export function ServiceForm({
  service,
  branches,
  onDone,
  locale,
  currency,
  t,
}: CatalogProps & {
  service?: AdminService;
  branches: AdminBranch[];
  /** What was saved, in words. */
  onDone: (message: string) => void;
}) {
  const text = t.services;
  const action = useAdminAction();
  const [name, setName] = useState(service?.name.es ?? "");
  const [description, setDescription] = useState(
    service?.description?.es ?? "",
  );
  const [duration, setDuration] = useState(service?.durationMin ?? 30);
  const [price, setPrice] = useState(
    service ? toMajor(service.priceMinor, currency) : "",
  );
  const minor = toMinor(price, currency);
  const length = formatDuration(duration, {
    minutes: text.durationMin,
    hours: text.durationH,
    hoursMinutes: text.durationHM,
  });
  const money = (value: number) => formatMoney(value, currency, locale);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const branchId = value(form, "branchId");
    const what = [
      name.trim() || text.untitled,
      length,
      minor !== null ? money(minor) : "",
    ]
      .filter(Boolean)
      .join(" · ");
    action.mutate(
      {
        method: service ? "PATCH" : "POST",
        path: service ? `services/${service.id}` : "services",
        body: {
          ...commonFields(form, !service),
          durationMin: duration,
          priceMinor: minor ?? -1,
          ...(!service && branchId ? { branchId } : {}),
        },
      },
      {
        onSuccess: (result) =>
          result.ok &&
          onDone((service ? text.saved : text.created).replace("{what}", what)),
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
        <CommonInputs item={service} kind="services" t={t} />
        <FormSection title={text.sectionTime}>
          <div
            className="flex flex-wrap gap-2"
            role="radiogroup"
            aria-label={text.duration}
          >
            {DURATION_PRESETS.map((minutes) => (
              <label key={minutes} className={pill}>
                <input
                  type="radio"
                  name="durationPreset"
                  checked={duration === minutes}
                  onChange={() => setDuration(minutes)}
                  className="sr-only"
                />
                {formatDuration(minutes, {
                  minutes: text.durationMin,
                  hours: text.durationH,
                  hoursMinutes: text.durationHM,
                })}
              </label>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              name="durationMin"
              type="number"
              min={5}
              max={720}
              step={5}
              label={text.otherDuration}
              required
              value={duration}
              onChange={(event) => setDuration(Number(event.target.value) || 0)}
            />
            <PriceField
              currency={currency}
              locale={locale}
              label={text.price}
              {...(service
                ? { defaultValue: toMajor(service.priceMinor, currency) }
                : {})}
              onValue={setPrice}
            />
          </div>
        </FormSection>
        {!service && branches.length > 1 && (
          <FormSection title={text.where}>
            <Select name="branchId" label={text.where} defaultValue="">
              <option value="">{text.allBranches}</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {text.onlyAt.replace("{branch}", b.name)}
                </option>
              ))}
            </Select>
            <p className="-mt-1 text-sm text-fg-muted">{text.whereHint}</p>
          </FormSection>
        )}
        {action.data && !action.data.ok && (
          <Result result={action.data} t={t.common} />
        )}
        <Button type="submit" disabled={action.isPending} className="sm:w-fit">
          {service ? t.common.save : text.newService}
        </Button>
      </div>
      <Preview
        title={text.preview}
        image={service?.image ?? service?.images[0]}
        name={name.trim() || text.untitled}
        description={description.trim()}
        meta={length}
        price={minor !== null ? money(minor) : "—"}
      />
    </form>
  );
}
