"use client";

import { type FormEvent, useState } from "react";
import type { Locale } from "@/shared/i18n/locales";
import { Button } from "@/shared/ui/button";
import { Field } from "@/shared/ui/field";
import { Select } from "@/shared/ui/select";
import { cityOf } from "./admin-view";
import { useAdminAction } from "./api";
import { Fold, FormSection } from "./catalog-inputs";
import { formatDuration } from "./catalog-view";
import { HoursEditor } from "./hours-editor";
import { ImagesField } from "./image-field";
import type { AdminBranch, BookingRules, HoursRow } from "./schemas";
import { type AdminText, Result, slugify, value } from "./ui";

/** Mexico's zones first (most shops), then whatever the branch or this device already uses. */
const ZONES = [
  "America/Tijuana",
  "America/Hermosillo",
  "America/Mazatlan",
  "America/Chihuahua",
  "America/Mexico_City",
  "America/Monterrey",
  "America/Merida",
  "America/Cancun",
];
const DEFAULTS: BookingRules = {
  slotIntervalMin: 15,
  bufferMin: 0,
  minNoticeMin: 60,
  windowDays: 14,
  cancelNoticeMin: 120,
};
/** Choices per rule (minutes, or days for the window); a value already saved is always offered too. */
const CHOICES: Record<keyof BookingRules, number[]> = {
  slotIntervalMin: [10, 15, 20, 30, 45, 60],
  bufferMin: [0, 5, 10, 15, 30],
  minNoticeMin: [0, 30, 60, 120, 240, 1440],
  windowDays: [7, 14, 30, 60, 90, 180],
  cancelNoticeMin: [0, 60, 120, 240, 720, 1440],
};
const RULES = Object.keys(CHOICES) as (keyof BookingRules)[];

/** New or existing branch: details, zone, opening hours and booking rules in words. */
export function BranchForm({
  branch,
  locale,
  t,
  onDone,
}: {
  branch?: AdminBranch;
  locale: Locale;
  t: AdminText;
  /** What was saved, in words. */
  onDone: (message: string) => void;
}) {
  const text = t.branches;
  const action = useAdminAction();
  const [hours, setHours] = useState<HoursRow[]>(branch?.hours ?? []);
  const here = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const initialZone = branch?.timeZone ?? here;
  const zones = [...new Set([...ZONES, initialZone])];
  const [zone, setZone] = useState(initialZone);
  const [otherZone, setOtherZone] = useState(false);
  const words = {
    minutes: t.services.durationMin,
    hours: t.services.durationH,
    hoursMinutes: t.services.durationHM,
  };
  const label = (rule: keyof BookingRules, n: number) =>
    rule === "windowDays"
      ? text.days.replace("{n}", String(n))
      : n === 0
        ? text.none
        : n >= 1440 && n % 1440 === 0
          ? text.days.replace("{n}", String(n / 1440))
          : formatDuration(n, words);
  const clock = (timeZone: string) =>
    new Intl.DateTimeFormat(locale, {
      hour: "numeric",
      minute: "2-digit",
      timeZone,
    }).format(new Date());

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = value(form, "name");
    const phone = value(form, "phone");
    const booking = Object.fromEntries(
      RULES.map((rule) => [rule, Number(value(form, rule))]),
    );
    action.mutate(
      {
        method: branch ? "PATCH" : "POST",
        path: branch ? `branches/${branch.id}` : "branches",
        body: {
          name,
          address: value(form, "address")
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean),
          ...(phone ? { phone } : {}),
          images: form.getAll("images").map(String),
          timeZone: zone,
          hours,
          booking,
          ...(branch ? {} : { slug: value(form, "slug") || slugify(name) }),
        },
      },
      {
        onSuccess: (result) =>
          result.ok &&
          onDone((branch ? text.saved : text.created).replace("{what}", name)),
      },
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-6">
      <FormSection title={text.sectionInfo}>
        <ImagesField
          kind="branches"
          label={t.images.photo}
          defaultValue={branch?.images}
          t={t.images}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            name="name"
            label={t.team.name}
            required
            maxLength={80}
            defaultValue={branch?.name}
          />
          <Field
            name="phone"
            type="tel"
            label={text.phone}
            defaultValue={branch?.phone}
          />
        </div>
        <label className="grid gap-2 text-sm font-medium">
          {text.address}
          <textarea
            name="address"
            rows={2}
            required
            defaultValue={branch?.address.join("\n")}
            className="rounded-2xl border border-line-strong bg-surface p-3 font-normal text-fg focus:border-accent"
          />
        </label>
        <div className="grid gap-2">
          {otherZone ? (
            <Field
              name="timeZone"
              label={text.timeZone}
              required
              value={zone}
              onChange={(event) => setZone(event.target.value.trim())}
            />
          ) : (
            <Select
              name="timeZone"
              label={text.timeZone}
              value={zone}
              onChange={(event) => {
                if (event.target.value === "__other") setOtherZone(true);
                else setZone(event.target.value);
              }}
            >
              {zones.map((z) => (
                <option key={z} value={z}>
                  {cityOf(z)} · {clock(z)}
                </option>
              ))}
              <option value="__other">{text.otherZone}</option>
            </Select>
          )}
          <p className="text-sm text-fg-muted">{text.timeZoneHint}</p>
        </div>
        {!branch && (
          <Fold title={t.common.advanced}>
            <Field name="slug" label={t.common.slug} hint={t.common.slugHint} />
          </Fold>
        )}
      </FormSection>

      <FormSection title={text.sectionHours}>
        <HoursEditor
          value={hours}
          onChange={setHours}
          locale={locale}
          t={t.hours}
        />
      </FormSection>

      <FormSection title={text.sectionRules}>
        <p className="-mt-2 text-sm text-fg-muted">{text.rulesHint}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {RULES.map((rule) => {
            const current = branch?.booking[rule] ?? DEFAULTS[rule];
            const options = [...new Set([...CHOICES[rule], current])].sort(
              (a, b) => a - b,
            );
            return (
              <Select
                key={rule}
                name={rule}
                label={text[rule]}
                defaultValue={String(current)}
              >
                {options.map((n) => (
                  <option key={n} value={n}>
                    {label(rule, n)}
                  </option>
                ))}
              </Select>
            );
          })}
        </div>
      </FormSection>

      {action.data && !action.data.ok && (
        <Result result={action.data} t={t.common} />
      )}
      <Button type="submit" disabled={action.isPending} className="sm:w-fit">
        {branch ? t.common.save : text.newBranch}
      </Button>
    </form>
  );
}
