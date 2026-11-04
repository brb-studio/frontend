"use client";

import { Check } from "lucide-react";
import { type FormEvent, useState } from "react";
import type * as z from "zod";
import type { Locale } from "@/shared/i18n/locales";
import { pick } from "@/shared/i18n/localized";
import { Button } from "@/shared/ui/button";
import { Field } from "@/shared/ui/field";
import { Select } from "@/shared/ui/select";
import { useAdminAction } from "./api";
import { Fold, FormSection } from "./catalog-inputs";
import { HoursEditor } from "./hours-editor";
import { ImagesField } from "./image-field";
import type {
  AdminBarber,
  AdminBranch,
  AdminService,
  HoursRow,
  staffSchema,
} from "./schemas";
import { type AdminText, Result, slugify, value } from "./ui";

type Account = z.output<typeof staffSchema>;

/** Services as tick cards, with "all" and "none". */
function ServicePicker({
  services,
  picked,
  onChange,
  locale,
  t,
}: {
  services: AdminService[];
  picked: string[];
  onChange: (ids: string[]) => void;
  locale: Locale;
  t: AdminText;
}) {
  return (
    <div className="grid gap-2">
      <div className="flex gap-2 text-sm">
        <button
          type="button"
          className="min-h-9 rounded-full border border-line px-3 hover:border-accent"
          onClick={() => onChange(services.map((s) => s.id))}
        >
          {t.barbers.selectAll}
        </button>
        <button
          type="button"
          className="min-h-9 rounded-full border border-line px-3 hover:border-accent"
          onClick={() => onChange([])}
        >
          {t.barbers.selectNone}
        </button>
      </div>
      <ul className="grid gap-2 sm:grid-cols-2">
        {services.map((s) => {
          const on = picked.includes(s.id);
          return (
            <li key={s.id}>
              <label
                className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl border px-3 py-2 text-sm transition-colors ${on ? "border-accent bg-card" : "border-line bg-surface hover:border-accent"}`}
              >
                <input
                  type="checkbox"
                  checked={on}
                  onChange={(event) =>
                    onChange(
                      event.target.checked
                        ? [...picked, s.id]
                        : picked.filter((id) => id !== s.id),
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
                <span className="truncate">{pick(s.name, locale)}</span>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** New or existing barber: profile, branch (when new), account, services and hours. */
export function BarberForm({
  barber,
  branches,
  services,
  accounts,
  taken,
  me,
  locale,
  t,
  onDone,
}: {
  barber?: AdminBarber;
  branches: AdminBranch[];
  services: AdminService[];
  /** Staff accounts, when this person may link them. */
  accounts?: Account[] | undefined;
  /** Accounts already linked to another profile. */
  taken: Set<string>;
  me: string;
  locale: Locale;
  t: AdminText;
  /** What was saved, in words. */
  onDone: (message: string) => void;
}) {
  const text = t.barbers;
  const action = useAdminAction();
  const [branchId, setBranchId] = useState(
    barber?.branchId ?? branches.find((b) => b.active)?.id ?? "",
  );
  const branch = branches.find((b) => b.id === branchId);
  const offered = services.filter(
    (s) => s.active && (!s.branchId || s.branchId === branchId),
  );
  const [serviceIds, setServiceIds] = useState<string[]>(
    () => barber?.serviceIds ?? offered.map((s) => s.id),
  );
  const [hours, setHours] = useState<HoursRow[]>(
    () => barber?.hours ?? branch?.hours ?? [],
  );
  // Owners and admins can cut too (anywhere); barber accounts only in their own branch.
  const linkable = accounts?.filter(
    (u) =>
      u.id === barber?.userId ||
      (u.active &&
        !taken.has(u.id) &&
        (u.role === "owner" ||
          u.role === "admin" ||
          (u.role === "barber" && u.branchId === branchId))),
  );

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = value(form, "name");
    const specialty = value(form, "specialty");
    const userId = value(form, "userId");
    const body = {
      name,
      ...(specialty ? { specialty: { es: specialty } } : {}),
      images: form.getAll("images").map(String),
      hours,
      serviceIds: serviceIds.filter((id) => offered.some((s) => s.id === id)),
      ...(barber
        ? linkable
          ? { userId: userId || null }
          : {}
        : {
            branchId,
            slug: value(form, "slug") || slugify(name),
            ...(userId ? { userId } : {}),
          }),
    };
    action.mutate(
      {
        method: barber ? "PATCH" : "POST",
        path: barber ? `barbers/${barber.id}` : "barbers",
        body,
      },
      {
        onSuccess: (result) =>
          result.ok &&
          onDone(
            (barber ? text.saved : text.created).replace(
              "{what}",
              [name, branch?.name].filter(Boolean).join(" · "),
            ),
          ),
      },
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-6">
      <FormSection title={text.sectionProfile}>
        <ImagesField
          kind="barbers"
          label={t.images.photo}
          defaultValue={barber?.images}
          t={t.images}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            name="name"
            label={t.team.name}
            required
            maxLength={80}
            defaultValue={barber?.name}
          />
          <Field
            name="specialty"
            label={text.specialtyEs}
            maxLength={80}
            defaultValue={barber?.specialty?.es}
          />
        </div>
        {!barber && (
          <>
            <Select
              name="branchId"
              label={t.common.branch}
              required
              value={branchId}
              onChange={(event) => {
                const next = event.target.value;
                setBranchId(next);
                const nextBranch = branches.find((b) => b.id === next);
                setHours(nextBranch?.hours ?? []);
                setServiceIds(
                  services
                    .filter(
                      (s) => s.active && (!s.branchId || s.branchId === next),
                    )
                    .map((s) => s.id),
                );
              }}
            >
              {branches
                .filter((b) => b.active)
                .map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
            </Select>
            <Fold title={t.common.advanced}>
              <Field
                name="slug"
                label={t.common.slug}
                hint={t.common.slugHint}
              />
            </Fold>
          </>
        )}
      </FormSection>

      {linkable && (
        <FormSection title={text.sectionAccount}>
          <Select
            name="userId"
            label={text.account}
            defaultValue={barber?.userId ?? ""}
          >
            <option value="">{text.noAccount}</option>
            {linkable.map((u) => (
              <option key={u.id} value={u.id}>
                {u.id === me ? `${text.you} · ` : ""}
                {u.name} · {u.email}
              </option>
            ))}
          </Select>
          <p className="-mt-1 text-sm text-fg-muted">{text.accountHint}</p>
        </FormSection>
      )}

      <FormSection title={text.sectionServices}>
        <ServicePicker
          services={offered}
          picked={serviceIds}
          onChange={setServiceIds}
          locale={locale}
          t={t}
        />
      </FormSection>

      <FormSection title={text.sectionHours}>
        <HoursEditor
          value={hours}
          onChange={setHours}
          locale={locale}
          t={t.hours}
        />
      </FormSection>

      {action.data && !action.data.ok && (
        <Result result={action.data} t={t.common} />
      )}
      <Button
        type="submit"
        disabled={action.isPending || !branchId}
        className="sm:w-fit"
      >
        {barber ? t.common.save : text.newBarber}
      </Button>
    </form>
  );
}
