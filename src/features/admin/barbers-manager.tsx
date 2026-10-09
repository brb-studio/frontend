"use client";

import { useQuery } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import * as z from "zod";
import type { Locale } from "@/shared/i18n/locales";
import { pick } from "@/shared/i18n/localized";
import { Button } from "@/shared/ui/button";
import { Field } from "@/shared/ui/field";
import { Select } from "@/shared/ui/select";
import { adminQuery, useAdminAction } from "./api";
import { HoursEditor } from "./hours-editor";
import { ImagesField } from "./image-field";
import {
  type AdminBarber,
  type AdminService,
  barberSchema,
  branchSchema,
  type HoursRow,
  serviceSchema,
} from "./schemas";
import {
  type AdminText,
  Panel,
  Result,
  Row,
  slugify,
  smallButton,
  Toggle,
  value,
} from "./ui";

type Props = { locale: Locale; t: AdminText; canCreate: boolean };

const barbersQuery = adminQuery("barbers", z.array(barberSchema));
const branchesQuery = adminQuery("branches", z.array(branchSchema));
const servicesQuery = adminQuery("services", z.array(serviceSchema));

function BarberEditor({
  barber,
  services,
  locale,
  t,
  onDone,
}: {
  barber: AdminBarber;
  services: AdminService[];
  locale: Locale;
  t: AdminText;
  onDone: () => void;
}) {
  const action = useAdminAction();
  const [hours, setHours] = useState<HoursRow[]>(barber.hours);
  const [serviceIds, setServiceIds] = useState(barber.serviceIds);
  // A barber can only do services for every branch or for their own.
  const available = services.filter(
    (s) => s.active && (!s.branchId || s.branchId === barber.branchId),
  );

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const specialty = value(form, "specialty");
    action.mutate(
      {
        method: "PATCH",
        path: `barbers/${barber.id}`,
        body: {
          name: value(form, "name"),
          ...(specialty ? { specialty: { es: specialty } } : {}),
          images: form.getAll("images").map(String),
          hours,
          serviceIds,
        },
      },
      { onSuccess: (result) => result.ok && onDone() },
    );
  }

  return (
    <form onSubmit={submit} className="grid w-full gap-4">
      <ImagesField
        label={t.images.photo}
        defaultValue={barber.images}
        t={t.images}
      />
      <Field
        name="name"
        label={t.team.name}
        required
        defaultValue={barber.name}
      />
      <Field
        name="specialty"
        label={t.barbers.specialtyEs}
        defaultValue={barber.specialty?.es}
      />
      <fieldset className="grid gap-1">
        <legend className="mb-1 text-sm font-medium">
          {t.barbers.services}
        </legend>
        {available.map((s) => (
          <Toggle
            key={s.id}
            label={pick(s.name, locale)}
            checked={serviceIds.includes(s.id)}
            onChange={(on) =>
              setServiceIds((ids) =>
                on ? [...ids, s.id] : ids.filter((id) => id !== s.id),
              )
            }
          />
        ))}
      </fieldset>
      <fieldset className="grid gap-2">
        <legend className="mb-1 text-sm font-medium">{t.barbers.hours}</legend>
        <HoursEditor
          value={hours}
          onChange={setHours}
          locale={locale}
          t={t.hours}
        />
      </fieldset>
      <Result result={action.data} t={t.common} />
      <Button type="submit" disabled={action.isPending}>
        {t.common.save}
      </Button>
    </form>
  );
}

function NewBarber({ t, onDone }: { t: AdminText; onDone: () => void }) {
  const branches = useQuery(branchesQuery);
  const action = useAdminAction();
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    action.mutate(
      {
        method: "POST",
        path: "barbers",
        body: {
          branchId: value(form, "branchId"),
          name: value(form, "name"),
          slug: value(form, "slug") || slugify(value(form, "name")),
        },
      },
      { onSuccess: (result) => result.ok && onDone() },
    );
  }
  return (
    <form onSubmit={submit} className="grid gap-3">
      <Select name="branchId" label={t.common.branch} required>
        {branches.data?.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </Select>
      <Field name="name" label={t.team.name} required />
      <Field name="slug" label={t.common.slug} hint={t.common.slugHint} />
      <Result result={action.data} t={t.common} />
      <Button type="submit" disabled={action.isPending}>
        {t.barbers.newBarber}
      </Button>
    </form>
  );
}

/** Barbers: who works where, what they do and when. */
export function BarbersManager({ locale, t, canCreate }: Props) {
  const barbers = useQuery(barbersQuery);
  const services = useQuery(servicesQuery);
  const branches = useQuery(branchesQuery);
  const toggle = useAdminAction();
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const branchName = (id: string) =>
    branches.data?.find((b) => b.id === id)?.name ?? "";

  return (
    <Panel
      title={t.nav.barbers}
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
      {adding && <NewBarber t={t} onDone={() => setAdding(false)} />}
      <Result result={toggle.data} t={t.common} />
      {barbers.isPending ? (
        <p className="text-fg-muted">{t.common.loading}</p>
      ) : barbers.data && barbers.data.length > 0 ? (
        <ul className="grid gap-2">
          {barbers.data.map((b) => (
            <Row
              key={b.id}
              muted={!b.active}
              image={b.image ?? ""}
              title={b.name}
              meta={`${branchName(b.branchId)} · ${b.serviceIds.length} ${t.nav.services.toLowerCase()} · ${b.active ? t.common.active : t.common.inactive}`}
            >
              <button
                type="button"
                className={smallButton}
                onClick={() => setEditing(editing === b.id ? null : b.id)}
              >
                {editing === b.id ? t.common.close : t.common.edit}
              </button>
              <button
                type="button"
                className={smallButton}
                disabled={toggle.isPending}
                onClick={() =>
                  toggle.mutate({
                    method: "PATCH",
                    path: `barbers/${b.id}`,
                    body: { active: !b.active },
                  })
                }
              >
                {b.active ? t.common.deactivate : t.common.activate}
              </button>
              {editing === b.id && services.data && (
                <BarberEditor
                  barber={b}
                  services={services.data}
                  locale={locale}
                  t={t}
                  onDone={() => setEditing(null)}
                />
              )}
            </Row>
          ))}
        </ul>
      ) : (
        <p className="text-fg-muted">{t.common.empty}</p>
      )}
    </Panel>
  );
}
