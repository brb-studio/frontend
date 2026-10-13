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
import { type AdminProduct, productSchema } from "./schemas";
import { CommonInputs, commonFields } from "./services-manager";
import { type AdminText, Panel, Result, Row, smallButton, value } from "./ui";

type Props = { locale: Locale; currency: string; t: AdminText };

const productsQuery = adminQuery("products", z.array(productSchema));

function ProductForm({
  product,
  onDone,
  currency,
  t,
}: Props & { product?: AdminProduct; onDone?: () => void }) {
  const action = useAdminAction();
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const category = value(form, "category");
    const stock = value(form, "stock");
    action.mutate(
      {
        method: product ? "PATCH" : "POST",
        path: product ? `products/${product.id}` : "products",
        body: {
          ...commonFields(form, !product),
          priceMinor: toMinor(value(form, "price"), currency) ?? -1,
          // Empty takes the value away when editing; when creating it just isn't sent.
          ...(product
            ? {
                category: category || null,
                stock: stock === "" ? null : Number(stock),
              }
            : {
                ...(category ? { category } : {}),
                ...(stock === "" ? {} : { stock: Number(stock) }),
              }),
        },
      },
      { onSuccess: (result) => result.ok && onDone?.() },
    );
  }
  return (
    <form onSubmit={submit} className="grid gap-4">
      <CommonInputs item={product} t={t} />
      <div className="grid gap-3 sm:grid-cols-3">
        <Field
          name="price"
          inputMode="decimal"
          label={t.products.price}
          required
          defaultValue={product ? toMajor(product.priceMinor, currency) : ""}
        />
        <Field
          name="category"
          label={t.products.category}
          maxLength={40}
          defaultValue={product?.category}
        />
        <Field
          name="stock"
          type="number"
          min={0}
          step={1}
          label={t.products.stock}
          hint={t.products.stockHint}
          defaultValue={product?.stock}
        />
      </div>
      <Result result={action.data} t={t.common} />
      <Button type="submit" disabled={action.isPending}>
        {product ? t.common.save : t.products.newProduct}
      </Button>
    </form>
  );
}

export function ProductsManager(props: Props) {
  const { locale, currency, t } = props;
  const products = useQuery(productsQuery);
  const toggle = useAdminAction();
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  return (
    <Panel
      title={t.nav.products}
      action={
        <button
          type="button"
          className={smallButton}
          onClick={() => setAdding(!adding)}
        >
          {adding ? t.common.close : t.products.newProduct}
        </button>
      }
    >
      {adding && <ProductForm {...props} onDone={() => setAdding(false)} />}
      <Result result={toggle.data} t={t.common} />
      {products.isPending ? (
        <p className="text-fg-muted">{t.common.loading}</p>
      ) : products.data && products.data.length > 0 ? (
        <ul className="grid gap-2">
          {products.data.map((p) => (
            <Row
              key={p.id}
              muted={!p.active}
              image={p.image ?? ""}
              title={pick(p.name, locale)}
              meta={[
                formatMoney(p.priceMinor, currency, locale),
                p.category,
                p.stock === undefined
                  ? t.products.uncounted
                  : `${p.stock} ${t.products.left}`,
                p.active ? t.common.active : t.common.inactive,
              ]
                .filter(Boolean)
                .join(" · ")}
            >
              <button
                type="button"
                className={smallButton}
                onClick={() => setEditing(editing === p.id ? null : p.id)}
              >
                {editing === p.id ? t.common.close : t.common.edit}
              </button>
              <button
                type="button"
                className={smallButton}
                disabled={toggle.isPending}
                onClick={() =>
                  toggle.mutate({
                    method: "PATCH",
                    path: `products/${p.id}`,
                    body: { active: !p.active },
                  })
                }
              >
                {p.active ? t.common.deactivate : t.common.activate}
              </button>
              {editing === p.id && (
                <div className="w-full">
                  <ProductForm
                    {...props}
                    product={p}
                    onDone={() => setEditing(null)}
                  />
                </div>
              )}
            </Row>
          ))}
        </ul>
      ) : (
        <p className="text-fg-muted">{t.products.empty}</p>
      )}
    </Panel>
  );
}
