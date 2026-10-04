"use client";

import { useQuery } from "@tanstack/react-query";
import type { FormEvent } from "react";
import { Button } from "@/shared/ui/button";
import { Field } from "@/shared/ui/field";
import { adminQuery, useAdminAction } from "./api";
import { tenantSchema } from "./schemas";
import { type AdminText, Panel, Result, value } from "./ui";

const tenantQuery = adminQuery("tenant", tenantSchema);

/** The business's name and look; changes show on the public site on the next page load. */
export function SettingsForm({ t }: { t: AdminText }) {
  const tenant = useQuery(tenantQuery);
  const action = useAdminAction();
  const accent = tenant.data?.theme.accent;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const instagram = value(form, "instagram");
    action.mutate({
      method: "PATCH",
      path: "tenant",
      body: {
        name: value(form, "name"),
        theme: { ...tenant.data?.theme, accent: value(form, "accent") },
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
          <label className="grid gap-2 text-sm font-medium">
            {t.settings.accent}
            <input
              type="color"
              name="accent"
              defaultValue={
                typeof accent === "string" && /^#[0-9a-f]{6}$/i.test(accent)
                  ? accent
                  : "#ff6a1a"
              }
              className="h-12 w-24 cursor-pointer rounded-xl border border-line-strong bg-surface"
            />
          </label>
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
