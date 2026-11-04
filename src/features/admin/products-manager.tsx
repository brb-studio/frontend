"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowUp,
  CircleCheck,
  MapPin,
  Package,
  Pencil,
  Plus,
  Search,
  Tag,
  TriangleAlert,
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
import { filterCatalog, moveTo, type StatusFilter } from "./catalog-view";
import { ProductForm } from "./product-form";
import {
  categoriesOf,
  inCategory,
  stockAlerts,
  stockState,
} from "./products-view";
import { type AdminProduct, branchSchema, productSchema } from "./schemas";
import type { CatalogProps } from "./service-form";
import { Panel, pill, Result } from "./ui";

const productsQuery = adminQuery("products", z.array(productSchema));
const branchesQuery = adminQuery("branches", z.array(branchSchema));

const STOCK_TONE = {
  out: "border-danger/50 text-danger",
  low: "border-accent text-accent-text",
  ok: "border-line text-fg-muted",
} as const;

export function ProductsManager(props: CatalogProps) {
  const { locale, currency, t } = props;
  const text = t.products;
  const products = useQuery(productsQuery);
  const branches = useQuery(branchesQuery);
  const action = useAdminAction();
  const [status, setStatus] = useState<StatusFilter>("active");
  const [category, setCategory] = useState("");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<AdminProduct | "new" | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const money = (minor: number) => formatMoney(minor, currency, locale);
  const branchName = (id?: string) =>
    branches.data?.find((b) => b.id === id)?.name ?? "";
  const all = products.data ?? [];
  const categories = categoriesOf(all);
  const ordered = [...all].sort((a, b) => a.position - b.position);
  const shown = filterCatalog(ordered, status, query).filter((p) =>
    inCategory(p, category),
  );
  const sortable =
    query.trim() === "" &&
    category === "" &&
    (status === "all" || all.every((p) => p.active === (status === "active")));
  const alerts = stockAlerts(all);

  const open = (next: AdminProduct | "new") => {
    setNotice(null);
    setEditing(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  async function move(id: string, direction: -1 | 1) {
    for (const change of moveTo(ordered, id, direction)) {
      await action.mutateAsync({
        method: "PATCH",
        path: `products/${change.id}`,
        body: { position: change.position },
      });
    }
  }
  const filters: [StatusFilter, string][] = [
    ["active", t.services.filterActive],
    ["inactive", t.services.filterInactive],
    ["all", t.services.filterAll],
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
            editing === "new"
              ? text.newProduct
              : `${t.common.edit}: ${pick(editing.name, locale)}`
          }
          action={
            <Button variant="secondary" onClick={() => setEditing(null)}>
              <X size={18} aria-hidden="true" />
              {t.common.close}
            </Button>
          }
        >
          <ProductForm
            key={editing === "new" ? "new" : editing.id}
            {...props}
            {...(editing === "new" ? {} : { product: editing })}
            branches={branches.data ?? []}
            categories={categories}
            onDone={(message) => {
              setEditing(null);
              setNotice(message);
            }}
          />
        </Panel>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        {(alerts.out > 0 || alerts.low > 0) && (
          <p className="flex flex-wrap items-center gap-2 text-sm">
            <TriangleAlert
              size={16}
              aria-hidden="true"
              className="text-danger"
            />
            {alerts.out > 0 && (
              <span className="text-danger">
                {alerts.out === 1
                  ? text.alertOutOne
                  : text.alertOut.replace("{n}", String(alerts.out))}
              </span>
            )}
            {alerts.low > 0 && (
              <span className="text-accent-text">
                {alerts.low === 1
                  ? text.alertLowOne
                  : text.alertLow.replace("{n}", String(alerts.low))}
              </span>
            )}
          </p>
        )}
        <Button className="ml-auto" onClick={() => open("new")}>
          <Plus size={18} aria-hidden="true" />
          {text.newProduct}
        </Button>
      </div>

      <div className="grid gap-3">
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
        {categories.length > 0 && (
          <div
            role="radiogroup"
            aria-label={text.categoryFilter}
            className="flex flex-wrap items-center gap-2"
          >
            <Tag size={16} aria-hidden="true" className="text-fg-muted" />
            {["", ...categories].map((c) => (
              <label key={c || "all"} className={pill}>
                <input
                  type="radio"
                  name="category"
                  checked={category === c}
                  onChange={() => setCategory(c)}
                  className="sr-only"
                />
                {c || text.allCategories}
              </label>
            ))}
          </div>
        )}
      </div>
      {sortable && shown.length > 1 && (
        <p className="-mt-2 text-sm text-fg-muted">{t.services.orderHint}</p>
      )}
      {action.data && !action.data.ok && (
        <Result result={action.data} t={t.common} />
      )}

      {products.isPending ? (
        <p className="text-fg-muted">{t.common.loading}</p>
      ) : shown.length === 0 ? (
        <p className="text-fg-muted">
          {query.trim()
            ? t.services.nothingFound.replace("{q}", query.trim())
            : text.noProducts}
        </p>
      ) : (
        <ul className="grid gap-3">
          {shown.map((p, index) => {
            const photo = p.image ?? p.images[0];
            return (
              <li
                key={p.id}
                className={`grid grid-cols-[5.5rem_minmax(0,1fr)] gap-4 rounded-3xl border border-line bg-card p-3 text-sm ${p.active ? "" : "opacity-60"}`}
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
                  ) : (
                    <Package size={26} aria-hidden="true" />
                  )}
                </div>
                <div className="grid min-w-0 content-between gap-2">
                  <div className="grid gap-1">
                    <p className="flex items-start justify-between gap-2">
                      <span className="text-base font-medium">
                        {pick(p.name, locale)}
                      </span>
                      <span className="shrink-0 text-base font-semibold tabular-nums">
                        {money(p.priceMinor)}
                      </span>
                    </p>
                    {p.description && (
                      <p className="line-clamp-1 text-fg-muted">
                        {pick(p.description, locale)}
                      </p>
                    )}
                    <p className="flex flex-wrap items-center gap-2 text-fg-muted">
                      {p.category && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-line px-2 py-0.5 text-xs">
                          <Tag size={12} aria-hidden="true" />
                          {p.category}
                        </span>
                      )}
                      {p.branchId && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin size={14} aria-hidden="true" />
                          {t.services.onlyAt.replace(
                            "{branch}",
                            branchName(p.branchId),
                          )}
                        </span>
                      )}
                    </p>
                    <p className="flex flex-wrap gap-1.5">
                      {p.stock.length === 0 ? (
                        <span className="text-fg-muted">{text.untracked}</span>
                      ) : (
                        p.stock.map((s) => {
                          const state = stockState(s.quantity);
                          return (
                            <span
                              key={s.branchId}
                              className={`rounded-full border px-2 py-0.5 text-xs tabular-nums ${STOCK_TONE[state]}`}
                            >
                              {branchName(s.branchId)}:{" "}
                              {state === "out"
                                ? text.out
                                : state === "low"
                                  ? text.low.replace("{n}", String(s.quantity))
                                  : text.units.replace(
                                      "{n}",
                                      String(s.quantity),
                                    )}
                            </span>
                          );
                        })
                      )}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 pr-1">
                      <input
                        type="checkbox"
                        role="switch"
                        aria-checked={p.active}
                        checked={p.active}
                        disabled={action.isPending}
                        onChange={(event) =>
                          action.mutate({
                            method: "PATCH",
                            path: `products/${p.id}`,
                            body: { active: event.target.checked },
                          })
                        }
                        className="peer sr-only"
                      />
                      <span
                        aria-hidden="true"
                        className="relative h-6 w-11 rounded-full bg-line transition-colors peer-checked:bg-accent peer-focus-visible:outline-2 peer-focus-visible:outline-accent after:absolute after:top-0.5 after:left-0.5 after:size-5 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-5"
                      />
                      <span>{t.services.activeLabel}</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => open(p)}
                      className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-line px-4 hover:border-accent"
                    >
                      <Pencil size={14} aria-hidden="true" />
                      {t.common.edit}
                    </button>
                    {sortable && (
                      <span className="ml-auto inline-flex gap-1">
                        <button
                          type="button"
                          aria-label={t.services.moveUp}
                          title={t.services.moveUp}
                          disabled={index === 0 || action.isPending}
                          onClick={() => void move(p.id, -1)}
                          className="grid size-11 place-items-center rounded-full border border-line hover:border-accent disabled:opacity-30"
                        >
                          <ArrowUp size={16} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          aria-label={t.services.moveDown}
                          title={t.services.moveDown}
                          disabled={
                            index === shown.length - 1 || action.isPending
                          }
                          onClick={() => void move(p.id, 1)}
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
