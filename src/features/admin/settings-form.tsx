"use client";

import { useQuery } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import { Button } from "@/shared/ui/button";
import { Field } from "@/shared/ui/field";
import { adminQuery, useAdminAction } from "./api";
import { tenantSchema } from "./schemas";
import { DEFAULT_DARK, DEFAULT_LIGHT, ThemeFields } from "./theme-fields";
import { type AdminText, Panel, Result, Toggle, value } from "./ui";

const tenantQuery = adminQuery("tenant", tenantSchema);

function RemindersForm({ enabled, t }: { enabled: boolean; t: AdminText }) {
  const action = useAdminAction();
  const [on, setOn] = useState(enabled);
  return (
    <Panel title={t.settings.reminders.title}>
      <div className="grid gap-3">
        <Toggle
          label={t.settings.reminders.enabled}
          checked={on}
          onChange={setOn}
        />
        <p className="text-xs text-fg-muted">{t.settings.reminders.hint}</p>
        <Result result={action.data} t={t.common} />
        <Button
          type="button"
          disabled={action.isPending}
          onClick={() =>
            action.mutate({
              method: "PATCH",
              path: "tenant",
              body: { reminders: { enabled: on } },
            })
          }
        >
          {t.common.save}
        </Button>
      </div>
    </Panel>
  );
}

function ProductsForm({ enabled, t }: { enabled: boolean; t: AdminText }) {
  const action = useAdminAction();
  const [on, setOn] = useState(enabled);
  return (
    <Panel title={t.settings.products.title}>
      <div className="grid gap-3">
        <Toggle
          label={t.settings.products.enabled}
          checked={on}
          onChange={setOn}
        />
        <p className="text-xs text-fg-muted">{t.settings.products.hint}</p>
        <Result result={action.data} t={t.common} />
        <Button
          type="button"
          disabled={action.isPending}
          onClick={() =>
            action.mutate({
              method: "PATCH",
              path: "tenant",
              body: { products: { enabled: on } },
            })
          }
        >
          {t.common.save}
        </Button>
      </div>
    </Panel>
  );
}

export function SettingsForm({ t }: { t: AdminText }) {
  const tenant = useQuery(tenantQuery);
  const action = useAdminAction();
  const accent = tenant.data?.theme.accent;
  const canvas = tenant.data?.theme.canvas;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const instagram = value(form, "instagram");
    const light = value(form, "canvasLight");
    const dark = value(form, "canvasDark");

    const { canvas: _old, ...rest } = tenant.data?.theme ?? {};
    const isDefault =
      light.toLowerCase() === DEFAULT_LIGHT &&
      dark.toLowerCase() === DEFAULT_DARK;
    action.mutate({
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
          ...tenant.data?.brand,
          ...(instagram ? { instagramUrl: instagram } : {}),
        },
      },
    });
  }

  if (!tenant.data) return <p className="text-fg-muted">{t.common.loading}</p>;
  const { subscription } = tenant.data;

  return (
    <div className="grid gap-6">
      <Panel title={t.nav.settings}>
        <form onSubmit={submit} className="grid gap-3">
          <Field
            name="name"
            label={t.settings.name}
            required
            defaultValue={tenant.data.name}
          />
          <ThemeFields t={t.settings} accent={accent} canvas={canvas} />
          <Field
            name="instagram"
            type="url"
            label={t.settings.instagram}
            defaultValue={tenant.data.brand.instagramUrl}
          />
          <Result result={action.data} t={t.common} />
          <Button type="submit" disabled={action.isPending}>
            {t.common.save}
          </Button>
        </form>
      </Panel>
      <RemindersForm enabled={tenant.data.reminders.enabled} t={t} />
      <ProductsForm enabled={tenant.data.products.enabled} t={t} />
      <Panel title={t.settings.plan}>
        <p className="text-sm">
          {subscription.plan} · {subscription.status} · {t.settings.limits}:{" "}
          {subscription.limits.branches} {t.settings.branches},{" "}
          {subscription.limits.barbers} {t.settings.barbers}
        </p>
      </Panel>
    </div>
  );
}
