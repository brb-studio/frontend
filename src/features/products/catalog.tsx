"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Minus, Plus, ShoppingBag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { Dictionary } from "@/shared/i18n/en";
import type { Locale } from "@/shared/i18n/locales";
import { pick } from "@/shared/i18n/localized";
import { formatMoney } from "@/shared/i18n/money";
import { ButtonLink } from "@/shared/ui/button";
import { FormAlert, SubmitButton } from "@/shared/ui/form";
import { reserveProducts } from "./actions";
import { type Catalog, myOrdersKey } from "./model";

const select =
  "h-13 w-full rounded-2xl border border-line-strong bg-surface px-4 text-fg focus:border-accent";

/** Pick products and quantities, then set them aside at a branch. Nothing is paid here. */
export function ProductCatalog({
  catalog,
  branches,
  initialBranch,
  signedIn,
  locale,
  t,
}: {
  catalog: Catalog;
  branches: { slug: string; name: string }[];
  initialBranch: string;
  signedIn: boolean;
  locale: Locale;
  t: Dictionary["products"];
}) {
  const queryClient = useQueryClient();
  const [branch, setBranch] = useState(initialBranch);
  const [cart, setCart] = useState<Record<string, number>>({});
  const reserve = useMutation({
    mutationFn: reserveProducts,
    onSuccess: (result) => {
      if (result.ok) {
        setCart({});
        void queryClient.invalidateQueries({ queryKey: myOrdersKey });
      }
    },
  });
  const money = (minor: number) => formatMoney(minor, catalog.currency, locale);
  const lines = catalog.products.filter((p) => (cart[p.slug] ?? 0) > 0);
  const total = lines.reduce(
    (sum, p) => sum + p.priceMinor * (cart[p.slug] ?? 0),
    0,
  );
  const change = (slug: string, by: number) =>
    setCart((c) => ({
      ...c,
      [slug]: Math.max(0, Math.min(20, (c[slug] ?? 0) + by)),
    }));

  if (catalog.products.length === 0) {
    return <p className="text-fg-muted">{t.empty}</p>;
  }

  return (
    <div className="grid gap-6">
      {branches.length > 1 && (
        <label className="grid gap-2 text-sm font-medium">
          {t.branch}
          <select
            className={select}
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
          >
            {branches.map((b) => (
              <option key={b.slug} value={b.slug}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
      )}
      <ul className="grid gap-3">
        {catalog.products.map((p) => {
          const quantity = cart[p.slug] ?? 0;
          return (
            <li
              key={p.slug}
              className="grid grid-cols-[4.5rem_1fr_auto] items-center gap-3 rounded-3xl border border-line bg-card p-3"
            >
              <span className="relative size-18 overflow-hidden rounded-2xl bg-surface">
                {p.image && (
                  <Image
                    src={p.image}
                    alt=""
                    fill
                    sizes="72px"
                    className="object-cover"
                  />
                )}
              </span>
              <span className="grid min-w-0">
                <span className="truncate font-medium">
                  {pick(p.name, locale)}
                </span>
                <span className="text-sm text-fg-muted">
                  {money(p.priceMinor)}
                  {p.category && ` · ${p.category}`}
                </span>
              </span>
              {p.available ? (
                <span className="flex items-center gap-1">
                  {quantity > 0 && (
                    <>
                      <button
                        type="button"
                        aria-label={t.remove}
                        className="grid size-11 place-items-center rounded-full border border-line"
                        onClick={() => change(p.slug, -1)}
                      >
                        <Minus size={16} aria-hidden="true" />
                      </button>
                      <span className="w-6 text-center tabular-nums">
                        {quantity}
                      </span>
                    </>
                  )}
                  <button
                    type="button"
                    aria-label={t.add}
                    className="grid size-11 place-items-center rounded-full border border-line text-accent-text"
                    onClick={() => change(p.slug, 1)}
                  >
                    <Plus size={16} aria-hidden="true" />
                  </button>
                </span>
              ) : (
                <span className="text-sm text-fg-muted">{t.soldOut}</span>
              )}
            </li>
          );
        })}
      </ul>

      {reserve.data?.ok ? (
        <div
          role="status"
          className="grid gap-3 rounded-2xl border border-accent p-4"
        >
          <p>{t.done}</p>
          <ButtonLink href={`/${locale}/account`}>{t.seeMine}</ButtonLink>
        </div>
      ) : lines.length > 0 ? (
        !signedIn ? (
          <Link
            href={`/${locale}/login`}
            className="text-center text-accent-text underline"
          >
            {t.signIn}
          </Link>
        ) : (
          <form
            className="grid gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              reserve.mutate({
                branch,
                items: lines.map((p) => ({
                  product: p.slug,
                  quantity: cart[p.slug] ?? 1,
                })),
              });
            }}
          >
            {reserve.data && !reserve.data.ok && (
              <FormAlert>{t.errors[reserve.data.error]}</FormAlert>
            )}
            <p className="flex justify-between font-medium">
              <span>{t.total}</span>
              <span>{money(total)}</span>
            </p>
            <p className="text-sm text-fg-muted">{t.reserveHint}</p>
            <SubmitButton
              pending={reserve.isPending}
              icon={<ShoppingBag size={18} aria-hidden="true" />}
            >
              {t.reserve}
            </SubmitButton>
          </form>
        )
      ) : null}
    </div>
  );
}
