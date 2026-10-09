"use client";

import { useQuery } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import * as z from "zod";
import type { Locale } from "@/shared/i18n/locales";
import { Button } from "@/shared/ui/button";
import { Field } from "@/shared/ui/field";
import { adminQuery, useAdminAction } from "./api";
import { HoursEditor } from "./hours-editor";
import { ImagesField } from "./image-field";
import {
  type AdminBranch,
  type BookingRules,
  branchSchema,
  type HoursRow,
} from "./schemas";
import { type AdminText, Panel, Result, Row, smallButton, value } from "./ui";

const branchesQuery = adminQuery("branches", z.array(branchSchema));
const RULES: (keyof BookingRules)[] = [
  "slotIntervalMin",
  "bufferMin",
  "minNoticeMin",
  "windowDays",
  "cancelNoticeMin",
];

function BranchForm({
  branch,
  locale,
  t,
  onDone,
}: {
  branch?: AdminBranch;
  locale: Locale;
  t: AdminText;
  onDone: () => void;
}) {
  const action = useAdminAction();
  const [hours, setHours] = useState<HoursRow[]>(branch?.hours ?? []);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const phone = value(form, "phone");
    const booking = Object.fromEntries(
      RULES.map((rule) => [rule, Number(value(form, rule))]),
    );
    const body = {
      name: value(form, "name"),
      address: value(form, "address")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
      ...(phone ? { phone } : {}),
      images: form.getAll("images").map(String),
      timeZone: value(form, "timeZone"),
      hours,
      booking,
      ...(branch ? {} : { slug: value(form, "slug") }),
    };
    action.mutate(
      {
        method: branch ? "PATCH" : "POST",
        path: branch ? `branches/${branch.id}` : "branches",
        body,
      },
      { onSuccess: (result) => result.ok && onDone() },
    );
  }

  return (
    <form onSubmit={submit} className="grid w-full gap-4">
      <ImagesField
        label={t.images.photo}
        defaultValue={branch?.images}
        t={t.images}
      />
      <Field
        name="name"
        label={t.team.name}
        required
        defaultValue={branch?.name}
      />
      {!branch && (
        <Field
          name="slug"
          label={t.common.slug}
          hint={t.common.slugHint}
          required
        />
      )}
      <label className="grid gap-2 text-sm font-medium">
        {t.branches.address}
        <textarea
          name="address"
          rows={2}
          required
          defaultValue={branch?.address.join("\n")}
          className="rounded-2xl border border-line-strong bg-surface p-3 font-normal text-fg focus:border-accent-text"
        />
      </label>
      <Field
        name="phone"
        type="tel"
        label={t.branches.phone}
        defaultValue={branch?.phone}
      />
      <Field
        name="timeZone"
        label={t.branches.timeZone}
        required
        defaultValue={
          branch?.timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone
        }
      />
      <fieldset className="grid gap-2">
        <legend className="mb-1 text-sm font-medium">{t.branches.hours}</legend>
        <HoursEditor
          value={hours}
          onChange={setHours}
          locale={locale}
          t={t.hours}
        />
      </fieldset>
      <fieldset className="grid grid-cols-2 gap-3">
        <legend className="col-span-2 mb-1 text-sm font-medium">
          {t.branches.rules}
        </legend>
        {RULES.map((rule) => (
          <Field
            key={rule}
            name={rule}
            type="number"
            min={0}
            label={t.branches[rule]}
            required
            defaultValue={
              branch?.booking[rule] ??
              {
                slotIntervalMin: 15,
                bufferMin: 0,
                minNoticeMin: 60,
                windowDays: 14,
                cancelNoticeMin: 120,
              }[rule]
            }
          />
        ))}
      </fieldset>
      <Result result={action.data} t={t.common} />
      <Button type="submit" disabled={action.isPending}>
        {branch ? t.common.save : t.branches.newBranch}
      </Button>
    </form>
  );
}

/** Branches: address, timezone, opening hours and booking rules. */
export function BranchesManager({
  locale,
  t,
  canCreate,
}: {
  locale: Locale;
  t: AdminText;
  canCreate: boolean;
}) {
  const branches = useQuery(branchesQuery);
  const toggle = useAdminAction();
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  return (
    <Panel
      title={t.nav.branches}
      action={
        canCreate ? (
          <button
            type="button"
            className={smallButton}
            onClick={() => setAdding(!adding)}
          >
            {adding ? t.common.close : t.common.add}
          </button>
        ) : undefined
      }
    >
      {adding && (
        <BranchForm locale={locale} t={t} onDone={() => setAdding(false)} />
      )}
      <Result result={toggle.data} t={t.common} />
      {branches.isPending ? (
        <p className="text-fg-muted">{t.common.loading}</p>
      ) : (
        <ul className="grid gap-2">
          {branches.data?.map((b) => (
            <Row
              key={b.id}
              muted={!b.active}
              image={b.image ?? ""}
              title={b.name}
              meta={`${b.address.join(", ")} · ${b.timeZone}`}
            >
              <button
                type="button"
                className={smallButton}
                onClick={() => setEditing(editing === b.id ? null : b.id)}
              >
                {editing === b.id ? t.common.close : t.common.edit}
              </button>
              {canCreate && (
                <button
                  type="button"
                  className={smallButton}
                  disabled={toggle.isPending}
                  onClick={() =>
                    toggle.mutate({
                      method: "PATCH",
                      path: `branches/${b.id}`,
                      body: { active: !b.active },
                    })
                  }
                >
                  {b.active ? t.common.deactivate : t.common.activate}
                </button>
              )}
              {editing === b.id && (
                <BranchForm
                  branch={b}
                  locale={locale}
                  t={t}
                  onDone={() => setEditing(null)}
                />
              )}
            </Row>
          ))}
        </ul>
      )}
    </Panel>
  );
}
