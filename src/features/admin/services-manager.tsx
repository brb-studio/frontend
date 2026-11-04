"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowUp,
  CircleCheck,
  Clock,
  MapPin,
  Package,
  Pencil,
  Plus,
  Scissors,
  Search,
  TriangleAlert,
  Users,
  X,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import * as z from "zod";
import { pick } from "@/shared/i18n/localized";
import { formatMoney } from "@/shared/i18n/money";
import { Button } from "@/shared/ui/button";
import { Field } from "@/shared/ui/field";
import { adminQuery, useAdminAction } from "./api";
import {
  filterCatalog,
  formatDuration,
  moveTo,
  offeredBy,
  type StatusFilter,
  savingsOf,
} from "./catalog-view";
import { PackageForm } from "./package-form";
import {
  type AdminPackage,
  type AdminService,
  barberSchema,
  branchSchema,
  packageSchema,
  serviceSchema,
} from "./schemas";
import { type CatalogProps, ServiceForm } from "./service-form";
import { Panel, pill, Result } from "./ui";

const servicesQuery = adminQuery("services", z.array(serviceSchema));
const packagesQuery = adminQuery("packages", z.array(packageSchema));
const barbersQuery = adminQuery("barbers", z.array(barberSchema));
const branchesQuery = adminQuery("branches", z.array(branchSchema));
type Tab = "services" | "packages";
type Editing = { kind: Tab; item: AdminService | AdminPackage | null };

export function ServicesManager(props: CatalogProps) {
  const { locale, currency, t } = props;
  const text = t.services;
  const services = useQuery(servicesQuery);
  const packages = useQuery(packagesQuery);
  const barbers = useQuery(barbersQuery);
  const branches = useQuery(branchesQuery);
  const action = useAdminAction();
  const [tab, setTab] = useState<Tab>("services");
  const [status, setStatus] = useState<StatusFilter>("active");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Editing | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const money = (minor: number) => formatMoney(minor, currency, locale);
  const words = {
    minutes: text.durationMin,
    hours: text.durationH,
    hoursMinutes: text.durationHM,
  };
  const branchName = (id?: string) =>
    branches.data?.find((b) => b.id === id)?.name ?? "";
  const serviceName = (id: string) => {
    const found = services.data?.find((s) => s.id === id);
    return found ? pick(found.name, locale) : "";
  };
  const all = (tab === "services" ? services.data : packages.data) ?? [];
  const ordered = [...all].sort((a, b) => a.position - b.position);
  const shown = filterCatalog(ordered, status, query);
  // Reordering only makes sense on the whole, unfiltered list.
  const canMove =
    status === "all" || all.every((i) => i.active === (status === "active"));
  const sortable = canMove && query.trim() === "";

  const open = (next: Editing) => {
    setNotice(null);
    setEditing(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const done = (message: string) => {
    setEditing(null);
    setNotice(message);
  };
  async function move(id: string, direction: -1 | 1) {
    for (const change of moveTo(ordered, id, direction)) {
      await action.mutateAsync({
        method: "PATCH",
        path: `${tab}/${change.id}`,
        body: { position: change.position },
      });
    }
  }
  const setActive = (item: AdminService | AdminPackage, active: boolean) =>
    action.mutate({
      method: "PATCH",
      path: `${tab}/${item.id}`,
      body: { active },
    });

  const tabs: { key: Tab; label: string; count: number }[] = [
    {
      key: "services",
      label: text.services,
      count: services.data?.length ?? 0,
    },
    {
      key: "packages",
      label: text.packages,
      count: packages.data?.length ?? 0,
    },
  ];
  const filters: [StatusFilter, string][] = [
    ["active", text.filterActive],
    ["inactive", text.filterInactive],
    ["all", text.filterAll],
  ];

  return (
    <div className="grid gap-5">
      {notice && (
        <div
          role="status"
          className="flex items-start justify-between gap-3 rounded-2xl border border-accent bg-card px-4 py-3 text-sm"
        >
          <p className="flex items-start gap-2">
            <CircleCheck
              size={18}
              aria-hidden="true"
              className="mt-0.5 shrink-0 text-accent-text"
            />
            {notice}
          </p>
          <button
            type="button"
            aria-label={t.common.close}
            className="-m-2 inline-flex size-11 shrink-0 items-center justify-center rounded-full text-fg-muted hover:text-fg"
            onClick={() => setNotice(null)}
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      )}

      {editing && (
        <Panel
          title={
            editing.item
              ? `${t.common.edit}: ${pick(editing.item.name, locale)}`
              : editing.kind === "services"
                ? text.newService
                : text.newPackage
          }
          action={
            <Button variant="secondary" onClick={() => setEditing(null)}>
              <X size={18} aria-hidden="true" />
              {t.common.close}
            </Button>
          }
        >
          {editing.kind === "services" ? (
            <ServiceForm
              key={editing.item?.id ?? "new"}
              {...props}
              branches={branches.data ?? []}
              {...(editing.item
                ? { service: editing.item as AdminService }
                : {})}
              onDone={done}
            />
          ) : (
            services.data && (
              <PackageForm
                key={editing.item?.id ?? "new"}
                {...props}
                services={services.data}
                {...(editing.item ? { pkg: editing.item as AdminPackage } : {})}
                onDone={done}
              />
            )
          )}
        </Panel>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label={t.nav.services}
          className="inline-flex rounded-full border border-line bg-card p-1"
        >
          {tabs.map(({ key, label, count }) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={`inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors ${tab === key ? "bg-accent text-accent-fg" : "text-fg-muted hover:text-fg"}`}
            >
              {key === "services" ? (
                <Scissors size={16} aria-hidden="true" />
              ) : (
                <Package size={16} aria-hidden="true" />
              )}
              {label}
              <span className="tabular-nums opacity-80">{count}</span>
            </button>
          ))}
        </div>
        <Button
          onClick={() => open({ kind: tab, item: null })}
          disabled={tab === "packages" && !services.data}
        >
          <Plus size={18} aria-hidden="true" />
          {tab === "services" ? text.newService : text.newPackage}
        </Button>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <Field
          name="q"
          type="search"
          label={text.search}
          value={query}
          autoComplete="off"
          icon={<Search size={18} />}
          onChange={(event) => setQuery(event.target.value)}
          className="min-w-56 flex-1"
        />
        <div role="radiogroup" className="flex flex-wrap gap-2 pb-1">
          {filters.map(([key, label]) => (
            <label key={key} className={pill}>
              <input
                type="radio"
                name="status"
                checked={status === key}
                onChange={() => setStatus(key)}
                className="sr-only"
              />
              {label}
            </label>
          ))}
        </div>
      </div>
      {sortable && shown.length > 1 && (
        <p className="-mt-2 text-sm text-fg-muted">{text.orderHint}</p>
      )}
      {action.data && !action.data.ok && (
        <Result result={action.data} t={t.common} />
      )}

      {(tab === "services" ? services : packages).isPending ? (
        <p className="text-fg-muted">{t.common.loading}</p>
      ) : shown.length === 0 ? (
        <p className="text-fg-muted">
          {query.trim()
            ? text.nothingFound.replace("{q}", query.trim())
            : tab === "services"
              ? text.noServices
              : text.noPackages}
        </p>
      ) : (
        <ul className="grid gap-3">
          {shown.map((item, index) => {
            const isService = tab === "services";
            const service = item as AdminService;
            const pkg = item as AdminPackage;
            const minutes = isService ? service.durationMin : pkg.durationMin;
            const people = isService
              ? offeredBy(item.id, barbers.data ?? [])
              : null;
            const saves = isService ? 0 : savingsOf(pkg);
            const photo = item.image ?? item.images[0];
            return (
              <li
                key={item.id}
                className={`grid grid-cols-[5.5rem_minmax(0,1fr)] gap-4 rounded-3xl border border-line bg-card p-3 text-sm ${item.active ? "" : "opacity-60"}`}
              >
                <div className="relative grid aspect-square place-items-center overflow-hidden rounded-2xl bg-surface text-fg-muted">
                  {photo ? (
                    <Image
                      src={photo}
                      alt=""
                      fill
                      sizes="88px"
                      className="object-cover"
                    />
                  ) : isService ? (
                    <Scissors size={26} aria-hidden="true" />
                  ) : (
                    <Package size={26} aria-hidden="true" />
                  )}
                </div>
                <div className="grid min-w-0 content-between gap-2">
                  <div className="grid gap-1">
                    <p className="flex items-start justify-between gap-2">
                      <span className="text-base font-medium">
                        {pick(item.name, locale)}
                      </span>
                      <span className="shrink-0 text-base font-semibold tabular-nums">
                        {money(item.priceMinor)}
                      </span>
                    </p>
                    {item.description && (
                      <p className="line-clamp-1 text-fg-muted">
                        {pick(item.description, locale)}
                      </p>
                    )}
                    <p className="flex flex-wrap gap-x-3 gap-y-1 text-fg-muted">
                      {minutes !== null && (
                        <span className="inline-flex items-center gap-1">
                          <Clock size={14} aria-hidden="true" />
                          {formatDuration(minutes, words)}
                        </span>
                      )}
                      {people !== null &&
                        (people === 0 ? (
                          <span className="inline-flex items-center gap-1 text-danger">
                            <TriangleAlert size={14} aria-hidden="true" />
                            {text.offeredByNone}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1">
                            <Users size={14} aria-hidden="true" />
                            {people === 1
                              ? text.offeredByOne
                              : text.offeredBy.replace("{n}", String(people))}
                          </span>
                        ))}
                      {item.branchId && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin size={14} aria-hidden="true" />
                          {text.onlyAt.replace(
                            "{branch}",
                            branchName(item.branchId),
                          )}
                        </span>
                      )}
                    </p>
                    {!isService && (
                      <p className="text-fg-muted">
                        {text.includes.replace(
                          "{list}",
                          pkg.items
                            .map((i) => serviceName(i.serviceId))
                            .join(" + "),
                        )}
                        {saves > 0 && (
                          <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-xs text-accent-fg">
                            {text.saves.replace("{amount}", money(saves))}
                          </span>
                        )}
                      </p>
                    )}
                    {!isService && !pkg.servicesActive && (
                      <p className="inline-flex items-center gap-1 text-danger">
                        <TriangleAlert size={14} aria-hidden="true" />
                        {text.inactiveServices}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 pr-1">
                      <input
                        type="checkbox"
                        role="switch"
                        aria-checked={item.active}
                        checked={item.active}
                        disabled={action.isPending}
                        onChange={(event) =>
                          setActive(item, event.target.checked)
                        }
                        className="peer sr-only"
                      />
                      <span
                        aria-hidden="true"
                        className="relative h-6 w-11 rounded-full bg-line transition-colors peer-checked:bg-accent peer-focus-visible:outline-2 peer-focus-visible:outline-accent after:absolute after:top-0.5 after:left-0.5 after:size-5 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-5"
                      />
                      <span>{text.activeLabel}</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => open({ kind: tab, item })}
                      className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-line px-4 hover:border-accent"
                    >
                      <Pencil size={14} aria-hidden="true" />
                      {t.common.edit}
                    </button>
                    {sortable && (
                      <span className="ml-auto inline-flex gap-1">
                        <button
                          type="button"
                          aria-label={text.moveUp}
                          title={text.moveUp}
                          disabled={index === 0 || action.isPending}
                          onClick={() => void move(item.id, -1)}
                          className="grid size-11 place-items-center rounded-full border border-line hover:border-accent disabled:opacity-30"
                        >
                          <ArrowUp size={16} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          aria-label={text.moveDown}
                          title={text.moveDown}
                          disabled={
                            index === shown.length - 1 || action.isPending
                          }
                          onClick={() => void move(item.id, 1)}
                          className="grid size-11 place-items-center rounded-full border border-line hover:border-accent disabled:opacity-30"
                        >
                          <ArrowDown size={16} aria-hidden="true" />
                        </button>
                      </span>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
