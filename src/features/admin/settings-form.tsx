"use client";

import { useQuery } from "@tanstack/react-query";
import {
  BadgeCheck,
  BellRing,
  type LucideIcon,
  Package,
  Palette,
  Receipt,
  ToggleRight,
} from "lucide-react";
import { type FormEvent, useState } from "react";
import * as z from "zod";
import type { Locale } from "@/shared/i18n/locales";
import { Button, ButtonLink } from "@/shared/ui/button";
import { Field } from "@/shared/ui/field";
import { ActiveSwitch, Notice, Section } from "./admin-kit";
import { adminQuery, useAdminAction } from "./api";
import { FiscalForm } from "./fiscal-form";
import { ImagesField } from "./image-field";
import { InvoicesQueue } from "./invoices-queue";
import { barberSchema, branchSchema, tenantSchema } from "./schemas";
import { DEFAULT_DARK, DEFAULT_LIGHT, ThemeFields } from "./theme-fields";
import { type AdminText, Result, value } from "./ui";

const tenantQuery = adminQuery("tenant", tenantSchema);
const branchesQuery = adminQuery("branches", z.array(branchSchema));
const barbersQuery = adminQuery("barbers", z.array(barberSchema));
type Tenant = z.output<typeof tenantSchema>;

function BrandForm({
  tenant,
  t,
  onSaved,
}: {
  tenant: Tenant;
  t: AdminText;
  onSaved: (message: string) => void;
}) {
  const action = useAdminAction();
  const text = t.settings;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const instagram = value(form, "instagram");
    const logo = value(form, "logo");
    const { instagramUrl: _instagram, logo: _logo, ...brand } = tenant.brand;
    const light = value(form, "canvasLight");
    const dark = value(form, "canvasDark");
    const { canvas: _old, ...rest } = tenant.theme;
    const isDefault =
      light.toLowerCase() === DEFAULT_LIGHT &&
      dark.toLowerCase() === DEFAULT_DARK;
    action.mutate(
      {
        method: "PATCH",
        path: "tenant",
        body: {
          name: value(form, "name"),
          theme: {
            ...rest,
            accent: value(form, "accent"),
            ...(isDefault ? {} : { canvas: { light, dark } }),
          },
          brand: {
            ...brand,
            ...(instagram ? { instagramUrl: instagram } : {}),
            ...(logo ? { logo } : {}),
          },
        },
      },
      {
        onSuccess: (result) => {
          if (result.ok) onSaved(text.brandSaved);
        },
      },
    );
  }

  return (
    <Section icon={Palette} title={text.brandTitle} lead={text.brandLead}>
      <form onSubmit={submit} className="grid gap-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            name="name"
            label={text.name}
            required
            defaultValue={tenant.name}
          />
          <Field
            name="instagram"
            type="url"
            label={text.instagram}
            placeholder={text.instagramHint}
            defaultValue={tenant.brand.instagramUrl}
          />
        </div>
        <ImagesField
          kind="logo"
          name="logo"
          max={1}
          label={text.logo}
          defaultValue={tenant.brand.logo ? [tenant.brand.logo] : []}
          t={t.images}
        />
        <ThemeFields
          t={text}
          accent={tenant.theme.accent}
          canvas={tenant.theme.canvas}
        />
        {action.data && !action.data.ok && (
          <Result result={action.data} t={t.common} />
        )}
        <div>
          <Button type="submit" disabled={action.isPending}>
            {t.common.save}
          </Button>
        </div>
      </form>
    </Section>
  );
}

/** A feature that turns on or off with its switch, saved right away (and put back if it fails). */
function FeatureRow({
  icon: Icon,
  title,
  label,
  hint,
  enabled,
  module,
  t,
  onSaved,
}: {
  icon: LucideIcon;
  title: string;
  label: string;
  hint: string;
  enabled: boolean;
  module: "reminders" | "products";
  t: AdminText;
  onSaved: (message: string) => void;
}) {
  const action = useAdminAction();
  const [on, setOn] = useState(enabled);
  const change = (next: boolean) => {
    setOn(next);
    action.mutate(
      {
        method: "PATCH",
        path: "tenant",
        body: { [module]: { enabled: next } },
      },
      {
        onSuccess: (result) => {
          if (!result.ok) {
            setOn(!next);
            return;
          }
          onSaved(
            (next ? t.settings.featureOn : t.settings.featureOff).replace(
              "{name}",
              title,
            ),
          );
        },
        onError: () => setOn(!next),
      },
    );
  };
  return (
    <li className="grid gap-2 rounded-2xl border border-line p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <Icon
            size={18}
            aria-hidden="true"
            className="mt-0.5 shrink-0 text-fg-muted"
          />
          <div className="grid gap-0.5">
            <p className="font-medium">{title}</p>
            <p className="text-sm text-fg-muted">{hint}</p>
          </div>
        </div>
        <ActiveSwitch
          label={label}
          checked={on}
          disabled={action.isPending}
          onChange={change}
        />
      </div>
      {action.data && !action.data.ok && (
        <Result result={action.data} t={t.common} />
      )}
    </li>
  );
}

function Usage({
  label,
  used,
  max,
  t,
}: {
  label: string;
  used: number | undefined;
  max: number;
  t: AdminText["settings"];
}) {
  const share = used === undefined ? 0 : Math.min(100, (used / max) * 100);
  const full = used !== undefined && used >= max;
  return (
    <div className="grid gap-1.5 text-sm">
      <p className="flex justify-between gap-3">
        <span className="text-fg-muted">{label}</span>
        <span className="font-medium tabular-nums">
          {used === undefined
            ? "…"
            : t.usage
                .replace("{used}", String(used))
                .replace("{max}", String(max))}
        </span>
      </p>
      <div className="h-1.5 overflow-hidden rounded-full bg-line">
        <div
          className={`h-full rounded-full ${full ? "bg-danger" : "bg-accent"}`}
          style={{ width: `${share}%` }}
        />
      </div>
      {full && <p className="text-xs text-danger">{t.atLimit}</p>}
    </div>
  );
}

function PlanPanel({
  tenant,
  t,
  locale,
  isOwner,
}: {
  tenant: Tenant;
  t: AdminText;
  locale: Locale;
  isOwner: boolean;
}) {
  const branches = useQuery(branchesQuery);
  const barbers = useQuery(barbersQuery);
  const { subscription } = tenant;
  const text = t.settings;
  const plans: Record<string, string> = text.plans;
  const statuses: Record<string, string> = t.billing.status;
  const active = subscription.status === "active";
  return (
    <Section
      icon={BadgeCheck}
      title={text.planTitle}
      lead={text.planLead}
      aside={
        isOwner && (
          <ButtonLink variant="secondary" href={`/${locale}/admin/billing`}>
            {text.manageBilling}
          </ButtonLink>
        )
      }
    >
      <p className="flex flex-wrap items-center gap-2">
        <span className="text-xl font-semibold">
          {plans[subscription.plan] ?? subscription.plan}
        </span>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs ${active ? "bg-accent text-accent-fg" : "border border-danger/60 text-danger"}`}
        >
          {statuses[subscription.status] ?? subscription.status}
        </span>
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Usage
          label={text.usageBranches}
          used={branches.data?.filter((b) => b.active).length}
          max={subscription.limits.branches}
          t={text}
        />
        <Usage
          label={text.usageBarbers}
          used={barbers.data?.filter((b) => b.active).length}
          max={subscription.limits.barbers}
          t={text}
        />
      </div>
    </Section>
  );
}

/**
 * The barbershop's settings, one block each: the brand, the features (saved as they're switched),
 * tax details with the invoice requests, and the plan with how much of it is in use.
 */
export function SettingsForm({
  t,
  locale,
  isOwner,
}: {
  t: AdminText;
  locale: Locale;
  isOwner: boolean;
}) {
  const tenant = useQuery(tenantQuery);
  const [notice, setNotice] = useState<string | null>(null);
  const text = t.settings;

  if (!tenant.data) return <p className="text-fg-muted">{t.common.loading}</p>;
  const data = tenant.data;

  return (
    <div className="grid gap-5">
      <p className="-mt-3 max-w-2xl text-sm text-fg-muted">{text.lead}</p>
      <Notice
        message={notice}
        closeLabel={t.common.close}
        onClose={() => setNotice(null)}
      />
      <BrandForm tenant={data} t={t} onSaved={setNotice} />
      <Section
        icon={ToggleRight}
        title={text.featuresTitle}
        lead={text.featuresLead}
      >
        <ul className="grid gap-3">
          <FeatureRow
            icon={BellRing}
            title={text.reminders.title}
            label={text.reminders.enabled}
            hint={text.reminders.hint}
            enabled={data.reminders.enabled}
            module="reminders"
            t={t}
            onSaved={setNotice}
          />
          <FeatureRow
            icon={Package}
            title={text.products.title}
            label={text.products.enabled}
            hint={text.products.hint}
            enabled={data.products.enabled}
            module="products"
            t={t}
            onSaved={setNotice}
          />
        </ul>
      </Section>
      <Section icon={Receipt} title={text.fiscal.title} lead={text.fiscalLead}>
        <FiscalForm
          iva={data.iva?.enabled ?? false}
          invoicing={data.invoicing}
          t={t}
          onSaved={setNotice}
        />
      </Section>
      {data.invoicing?.enabled && <InvoicesQueue t={t} locale={locale} />}
      <PlanPanel tenant={data} t={t} locale={locale} isOwner={isOwner} />
    </div>
  );
}
