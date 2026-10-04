"use client";

import { useQuery } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import * as z from "zod";
import type { Locale } from "@/shared/i18n/locales";
import { pick } from "@/shared/i18n/localized";
import { formatMoney, toMajor, toMinor } from "@/shared/i18n/money";
import { Button } from "@/shared/ui/button";
import { Field } from "@/shared/ui/field";
import { adminQuery, useAdminAction } from "./api";
import { ImageField } from "./image-field";
import {
  type AdminPackage,
  type AdminService,
  packageSchema,
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

type Props = { locale: Locale; currency: string; t: AdminText };

const servicesQuery = adminQuery("services", z.array(serviceSchema));
const packagesQuery = adminQuery("packages", z.array(packageSchema));

/** A text in both languages; English is optional (the site falls back to Spanish). */
function both(form: FormData, es: string, en: string) {
  const textEs = value(form, es);
  const textEn = value(form, en);
  if (!textEs && !textEn) return undefined;
  return {
    ...(textEs ? { es: textEs } : {}),
    ...(textEn ? { en: textEn } : {}),
  };
}

/** What services and packages share: names, description, photo and, when new, the URL name. */
function commonFields(form: FormData, isNew: boolean) {
  const name = both(form, "nameEs", "nameEn");
  const description = both(form, "descriptionEs", "descriptionEn");
  const image = value(form, "image");
  return {
    name,
    ...(description ? { description } : {}),
    ...(image ? { image } : {}),
    ...(isNew
      ? { slug: value(form, "slug") || slugify(name?.es ?? name?.en ?? "") }
      : {}),
  };
}

function CommonInputs({
  item,
  t,
}: {
  item?: AdminService | AdminPackage;
  t: AdminText;
}) {
  return (
    <>
      <ImageField
        label={t.images.photo}
        defaultValue={item?.image}
        t={t.images}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          name="nameEs"
          label={t.common.nameEs}
          required
          maxLength={80}
          defaultValue={item?.name.es}
        />
        <Field
          name="nameEn"
          label={t.common.nameEn}
          maxLength={80}
          defaultValue={item?.name.en}
        />
        <Field
          name="descriptionEs"
          label={t.common.descriptionEs}
          maxLength={500}
          defaultValue={item?.description?.es}
        />
        <Field
          name="descriptionEn"
          label={t.common.descriptionEn}
          maxLength={500}
          defaultValue={item?.description?.en}
        />
      </div>
      {!item && (
        <Field name="slug" label={t.common.slug} hint={t.common.slugHint} />
      )}
    </>
  );
}

function ServiceForm({
  service,
  onDone,
  currency,
  t,
}: Props & { service?: AdminService; onDone?: () => void }) {
  const action = useAdminAction();
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    action.mutate(
      {
        method: service ? "PATCH" : "POST",
        path: service ? `services/${service.id}` : "services",
        body: {
          ...commonFields(form, !service),
          durationMin: Number(value(form, "durationMin")),
          priceMinor: toMinor(value(form, "price"), currency) ?? -1,
        },
      },
      { onSuccess: (result) => result.ok && onDone?.() },
    );
  }
  return (
    <form onSubmit={submit} className="grid gap-4">
      <CommonInputs item={service} t={t} />
      <div className="grid grid-cols-2 gap-3">
        <Field
          name="durationMin"
          type="number"
          min={5}
          max={720}
          step={5}
          label={t.services.duration}
          required
          defaultValue={service?.durationMin ?? 30}
        />
        <Field
          name="price"
          inputMode="decimal"
          label={t.services.price}
          required
          defaultValue={service ? toMajor(service.priceMinor, currency) : ""}
        />
      </div>
      <Result result={action.data} t={t.common} />
      <Button type="submit" disabled={action.isPending}>
        {service ? t.common.save : t.services.newService}
      </Button>
    </form>
  );
}

function PackageForm({
  pkg,
  services,
  onDone,
  locale,
  currency,
  t,
}: Props & {
  pkg?: AdminPackage;
  services: AdminService[];
  onDone?: () => void;
}) {
  const action = useAdminAction();
  const [picked, setPicked] = useState<string[]>(
    pkg?.items.map((item) => item.serviceId) ?? [],
  );
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    action.mutate(
      {
        method: pkg ? "PATCH" : "POST",
        path: pkg ? `packages/${pkg.id}` : "packages",
        body: {
          ...commonFields(form, !pkg),
          priceMinor: toMinor(value(form, "price"), currency) ?? -1,
          items: picked.map((serviceId) => ({ serviceId })),
        },
      },
      { onSuccess: (result) => result.ok && onDone?.() },
    );
  }
  return (
    <form onSubmit={submit} className="grid gap-4">
      <CommonInputs item={pkg} t={t} />
      <Field
        name="price"
        inputMode="decimal"
        label={t.services.price}
        required
        defaultValue={pkg ? toMajor(pkg.priceMinor, currency) : ""}
      />
      <fieldset className="grid gap-1">
        <legend className="mb-1 text-sm font-medium">{t.services.items}</legend>
        {services
          .filter(
            (s) => s.active && (!s.branchId || s.branchId === pkg?.branchId),
          )
          .map((s) => (
            <Toggle
              key={s.id}
              label={`${pick(s.name, locale)} · ${s.durationMin} ${t.common.minutes}`}
              checked={picked.includes(s.id)}
              onChange={(on) =>
                setPicked((list) =>
                  on ? [...list, s.id] : list.filter((id) => id !== s.id),
                )
              }
            />
          ))}
      </fieldset>
      <Result result={action.data} t={t.common} />
      <Button type="submit" disabled={action.isPending || picked.length < 2}>
        {pkg ? t.common.save : t.services.newPackage}
      </Button>
    </form>
  );
}

/** Services and packages: photos, prices, durations, which ones are bookable. */
export function ServicesManager(props: Props) {
  const { locale, currency, t } = props;
  const services = useQuery(servicesQuery);
  const packages = useQuery(packagesQuery);
  const toggle = useAdminAction();
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState<"service" | "package" | null>(null);
  const price = (minor: number) => formatMoney(minor, currency, locale);

  const activeButton = (
    kind: "services" | "packages",
    item: AdminService | AdminPackage,
  ) => (
    <button
      type="button"
      className={smallButton}
      disabled={toggle.isPending}
      onClick={() =>
        toggle.mutate({
          method: "PATCH",
          path: `${kind}/${item.id}`,
          body: { active: !item.active },
        })
      }
    >
      {item.active ? t.common.deactivate : t.common.activate}
    </button>
  );
  const editButton = (id: string) => (
    <button
      type="button"
      className={smallButton}
      onClick={() => setEditing(editing === id ? null : id)}
    >
      {editing === id ? t.common.close : t.common.edit}
    </button>
  );
  const addButton = (kind: "service" | "package", label: string) => (
    <button
      type="button"
      className={smallButton}
      onClick={() => setAdding(adding === kind ? null : kind)}
    >
      {adding === kind ? t.common.close : label}
    </button>
  );

  return (
    <div className="grid gap-6">
      <Panel
        title={t.services.services}
        action={addButton("service", t.services.newService)}
      >
        {adding === "service" && (
          <ServiceForm {...props} onDone={() => setAdding(null)} />
        )}
        <Result result={toggle.data} t={t.common} />
        {services.isPending ? (
          <p className="text-fg-muted">{t.common.loading}</p>
        ) : (
          <ul className="grid gap-2">
            {services.data?.map((s) => (
              <Row
                key={s.id}
                muted={!s.active}
                image={s.image ?? ""}
                title={pick(s.name, locale)}
                meta={`${s.durationMin} ${t.common.minutes} · ${price(s.priceMinor)} · ${s.active ? t.common.active : t.common.inactive}`}
              >
                {editButton(s.id)}
                {activeButton("services", s)}
                {editing === s.id && (
                  <div className="w-full">
                    <ServiceForm
                      {...props}
                      service={s}
                      onDone={() => setEditing(null)}
                    />
                  </div>
                )}
              </Row>
            ))}
          </ul>
        )}
      </Panel>

      <Panel
        title={t.services.packages}
        action={addButton("package", t.services.newPackage)}
      >
        {adding === "package" && services.data && (
          <PackageForm
            {...props}
            services={services.data}
            onDone={() => setAdding(null)}
          />
        )}
        {packages.isPending ? (
          <p className="text-fg-muted">{t.common.loading}</p>
        ) : packages.data && packages.data.length > 0 ? (
          <ul className="grid gap-2">
            {packages.data.map((p) => (
              <Row
                key={p.id}
                muted={!p.active}
                image={p.image ?? ""}
                title={pick(p.name, locale)}
                meta={[
                  p.durationMin !== null
                    ? `${p.durationMin} ${t.common.minutes}`
                    : "",
                  price(p.priceMinor),
                  p.listPriceMinor !== null
                    ? `${price(p.listPriceMinor)} ${t.services.separately}`
                    : "",
                  p.servicesActive ? "" : t.services.inactiveServices,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              >
                {editButton(p.id)}
                {activeButton("packages", p)}
                {editing === p.id && services.data && (
                  <div className="w-full">
                    <PackageForm
                      {...props}
                      pkg={p}
                      services={services.data}
                      onDone={() => setEditing(null)}
                    />
                  </div>
                )}
              </Row>
            ))}
          </ul>
        ) : (
          <p className="text-fg-muted">{t.common.empty}</p>
        )}
      </Panel>
    </div>
  );
}
