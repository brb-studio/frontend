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
import { BecomeBarber } from "./become-barber";
import { HoursEditor } from "./hours-editor";
import { ImagesField } from "./image-field";
import {
  type AdminBarber,
  type AdminService,
  barberSchema,
  branchSchema,
  type HoursRow,
  serviceSchema,
  staffSchema,
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

type Props = {
  locale: Locale;
  t: AdminText;
  canCreate: boolean;
  canLink: boolean;
  me: string;
};
type Account = z.output<typeof staffSchema>;

const barbersQuery = adminQuery("barbers", z.array(barberSchema));
const branchesQuery = adminQuery("branches", z.array(branchSchema));
const servicesQuery = adminQuery("services", z.array(serviceSchema));
const usersQuery = adminQuery("users", z.array(staffSchema));

function BarberEditor({
  barber,
  services,
  locale,
  t,
  me,
  onDone,
}: {
  barber: AdminBarber;
  services: AdminService[];
  me: string;
  locale: Locale;
  t: AdminText;
  onDone: () => void;
}) {
  const action = useAdminAction();
  const [hours, setHours] = useState<HoursRow[]>(barber.hours);
  const [serviceIds, setServiceIds] = useState(barber.serviceIds);
  const users = useQuery(usersQuery);
  // Owners and admins can cut too (anywhere); barber accounts only in their own branch.
  const accounts = users.data?.filter(
    (u) =>
      u.id === barber.userId ||
      (u.active &&
        (u.role === "owner" ||
          u.role === "admin" ||
          (u.role === "barber" && u.branchId === barber.branchId))),
  );

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
          ...(accounts && { userId: value(form, "userId") || null }),
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
        kind="barbers"
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
      {accounts && (
        <div className="grid gap-1">
          <Select
            name="userId"
            label={t.barbers.account}
            defaultValue={barber.userId ?? ""}
          >
            <option value="">{t.barbers.noAccount}</option>
            {accounts.map((u) => (
              <option key={u.id} value={u.id}>
                {u.id === me ? `${t.barbers.you} · ` : ""}
                {u.name} · {u.email}
              </option>
            ))}
          </Select>
          <p className="text-xs text-fg-muted">{t.barbers.accountHint}</p>
        </div>
      )}
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

function NewBarber({
  t,
  services,
  accounts,
  taken,
  me,
  onDone,
}: {
  t: AdminText;
  services: AdminService[];
  accounts?: Account[];
  taken: Set<string>;
  me: string;
  onDone: () => void;
}) {
  const branches = useQuery(branchesQuery);
  const action = useAdminAction();
  const [picked, setPicked] = useState("");
  const branchId = picked || branches.data?.[0]?.id || "";
  const linkable = accounts?.filter(
    (u) =>
      u.active &&
      !taken.has(u.id) &&
      (u.role === "owner" ||
        u.role === "admin" ||
        (u.role === "barber" && u.branchId === branchId)),
  );
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const userId = value(form, "userId");
    action.mutate(
      {
        method: "POST",
        path: "barbers",
        body: {
          branchId,
          name: value(form, "name"),
          slug: value(form, "slug") || slugify(value(form, "name")),
          serviceIds: services
            .filter((s) => s.active && (!s.branchId || s.branchId === branchId))
            .map((s) => s.id),
          ...(userId && { userId }),
        },
      },
      { onSuccess: (result) => result.ok && onDone() },
    );
  }
  return (
    <form onSubmit={submit} className="grid gap-3">
      <Select
        name="branchId"
        label={t.common.branch}
        required
        value={branchId}
        onChange={(event) => setPicked(event.target.value)}
      >
        {branches.data?.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </Select>
      <Field name="name" label={t.team.name} required />
      <Field name="slug" label={t.common.slug} hint={t.common.slugHint} />
      {linkable && linkable.length > 0 && (
        <div className="grid gap-1">
          <Select name="userId" label={t.barbers.account} defaultValue="">
            <option value="">{t.barbers.noAccount}</option>
            {linkable.map((u) => (
              <option key={u.id} value={u.id}>
                {u.id === me ? `${t.barbers.you} · ` : ""}
                {u.name} · {u.email}
              </option>
            ))}
          </Select>
          <p className="text-xs text-fg-muted">{t.barbers.accountHint}</p>
        </div>
      )}
      <p className="text-xs text-fg-muted">{t.barbers.servicesHint}</p>
      <Result result={action.data} t={t.common} />
      <Button type="submit" disabled={action.isPending}>
        {t.barbers.newBarber}
      </Button>
    </form>
  );
}

export function BarbersManager({ locale, t, canCreate, canLink, me }: Props) {
  const barbers = useQuery(barbersQuery);
  const services = useQuery(servicesQuery);
  const branches = useQuery(branchesQuery);
  const users = useQuery({ ...usersQuery, enabled: canLink });
  const taken = new Set(barbers.data?.flatMap((b) => b.userId ?? []) ?? []);
  const accountOf = (b: AdminBarber) => {
    if (!b.userId) return t.barbers.noAccount;
    if (b.userId === me) return t.barbers.you;
    const user = users.data?.find((u) => u.id === b.userId);
    return user
      ? t.barbers.linkedTo.replace("{name}", user.name)
      : t.barbers.linked;
  };
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
      {canLink && barbers.data && !taken.has(me) && (
        <BecomeBarber t={t} me={me} />
      )}
      {adding && (
        <NewBarber
          t={t}
          services={services.data ?? []}
          accounts={users.data}
          taken={taken}
          me={me}
          onDone={() => setAdding(false)}
        />
      )}
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
              meta={`${branchName(b.branchId)} · ${b.serviceIds.length} ${t.nav.services.toLowerCase()} · ${accountOf(b)} · ${b.active ? t.common.active : t.common.inactive}`}
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
                  me={me}
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
