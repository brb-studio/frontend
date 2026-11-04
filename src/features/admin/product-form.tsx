"use client";

import { Minus, Package, Plus } from "lucide-react";
import { type FormEvent, useState } from "react";
import * as z from "zod";
import { formatMoney, toMajor, toMinor } from "@/shared/i18n/money";
import { Button } from "@/shared/ui/button";
import { Field } from "@/shared/ui/field";
import { Select } from "@/shared/ui/select";
import { useAdminAction } from "./api";
import { CommonInputs, commonFields, FormSection } from "./catalog-inputs";
import { parseStock, stockChanges } from "./products-view";
import type { AdminBranch, AdminProduct } from "./schemas";
import { type CatalogProps, Preview, PriceField } from "./service-form";
import { type AdminText, Result, value } from "./ui";

const created = z.object({ id: z.string() });

/** The active branches a product is sold at: its own, or every one. */
export const soldAt = (branchId: string | undefined, branches: AdminBranch[]) =>
  branches.filter((b) => b.active && (!branchId || b.id === branchId));

/** Units per branch: a switch to count them at all, and − / + around the number. */
function StockEditor({
  sites,
  counts,
  onChange,
  t,
}: {
  sites: AdminBranch[];
  counts: Record<string, number | null>;
  onChange: (branchId: string, quantity: number | null) => void;
  t: AdminText;
}) {
  const text = t.products;
  return (
    <ul className="grid gap-2">
      {sites.map((site) => {
        const quantity = counts[site.id] ?? null;
        const counted = quantity !== null;
        return (
          <li
            key={site.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-3 py-2 text-sm"
          >
            <span className="min-w-0 flex-1 font-medium">{site.name}</span>
            <label className="inline-flex min-h-11 cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={counted}
                onChange={(event) =>
                  onChange(site.id, event.target.checked ? 0 : null)
                }
                className="size-5 accent-[var(--color-accent)]"
              />
              {text.track}
            </label>
            {counted ? (
              <span className="inline-flex items-center gap-1">
                <button
                  type="button"
                  aria-label={`${text.less} · ${site.name}`}
                  disabled={quantity <= 0}
                  onClick={() => onChange(site.id, Math.max(0, quantity - 1))}
                  className="grid size-11 place-items-center rounded-full border border-line hover:border-accent disabled:opacity-30"
                >
                  <Minus size={16} aria-hidden="true" />
                </button>
                <input
                  aria-label={`${text.stock} · ${site.name}`}
                  inputMode="numeric"
                  value={String(quantity)}
                  onChange={(event) =>
                    onChange(site.id, parseStock(event.target.value) ?? 0)
                  }
                  className="h-11 w-16 rounded-xl border border-line-strong bg-card text-center tabular-nums"
                />
                <button
                  type="button"
                  aria-label={`${text.more} · ${site.name}`}
                  onClick={() => onChange(site.id, quantity + 1)}
                  className="grid size-11 place-items-center rounded-full border border-line hover:border-accent"
                >
                  <Plus size={16} aria-hidden="true" />
                </button>
              </span>
            ) : (
              <span className="text-fg-muted">{text.untracked}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/** New or existing product: photos, name, price, category (with the ones in use), branch when new, and stock. */
export function ProductForm({
  product,
  branches,
  categories,
  onDone,
  locale,
  currency,
  t,
}: CatalogProps & {
  product?: AdminProduct;
  branches: AdminBranch[];
  /** Categories already in use, offered as suggestions. */
  categories: string[];
  /** What was saved, in words. */
  onDone: (message: string) => void;
}) {
  const text = t.products;
  const action = useAdminAction();
  const stockAction = useAdminAction();
  const [name, setName] = useState(product?.name.es ?? "");
  const [description, setDescription] = useState(
    product?.description?.es ?? "",
  );
  const [price, setPrice] = useState(
    product ? toMajor(product.priceMinor, currency) : "",
  );
  const [category, setCategory] = useState(product?.category ?? "");
  const [branchId, setBranchId] = useState(product?.branchId ?? "");
  const [counts, setCounts] = useState<Record<string, number | null>>(() =>
    Object.fromEntries(
      (product?.stock ?? []).map((s) => [s.branchId, s.quantity]),
    ),
  );
  const minor = toMinor(price, currency);
  const money = (amount: number) => formatMoney(amount, currency, locale);
  const sites = soldAt(branchId || undefined, branches);
  const pending = action.isPending || stockAction.isPending;

  async function saveStock(productId: string) {
    const wanted = Object.fromEntries(
      sites.map((site) => [site.id, counts[site.id] ?? null]),
    );
    for (const change of stockChanges(product?.stock ?? [], wanted)) {
      const result = await stockAction.mutateAsync({
        method: "PUT",
        path: `products/${productId}/stock/${change.branchId}`,
        body: { quantity: change.quantity },
      });
      if (!result.ok) return false;
    }
    return true;
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const typed = value(form, "category");
    const what = [
      name.trim() || t.services.untitled,
      minor !== null ? money(minor) : "",
    ]
      .filter(Boolean)
      .join(" · ");
    action.mutate(
      {
        method: product ? "PATCH" : "POST",
        path: product ? `products/${product.id}` : "products",
        body: {
          ...commonFields(form, !product),
          priceMinor: minor ?? -1,
          // Empty takes the category away when editing; when creating it just isn't sent.
          ...(product
            ? { category: typed || null }
            : typed
              ? { category: typed }
              : {}),
          ...(!product && branchId ? { branchId } : {}),
        },
      },
      {
        onSuccess: async (result) => {
          if (!result.ok) return;
          const id = product?.id ?? created.safeParse(result.data).data?.id;
          if (id && !(await saveStock(id))) return;
          onDone(
            (product ? t.services.saved : t.services.created).replace(
              "{what}",
              what,
            ),
          );
        },
      },
    );
  }

  return (
    <form
      onSubmit={submit}
      onChange={(event) => {
        const field = event.target as EventTarget as HTMLInputElement;
        if (field.name === "nameEs") setName(field.value);
        if (field.name === "descriptionEs") setDescription(field.value);
        if (field.name === "category") setCategory(field.value);
      }}
      className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]"
    >
      <div className="grid min-w-0 gap-6">
        <CommonInputs item={product} kind="products" t={t} />
        <FormSection title={text.sectionPrice}>
          <div className="grid gap-3 sm:grid-cols-2">
            <PriceField
              currency={currency}
              locale={locale}
              label={text.price}
              {...(product
                ? { defaultValue: toMajor(product.priceMinor, currency) }
                : {})}
              onValue={setPrice}
            />
            <Field
              name="category"
              label={text.category}
              hint={text.categoryHint}
              maxLength={40}
              list="product-categories"
              autoComplete="off"
              defaultValue={product?.category}
            />
            <datalist id="product-categories">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
        </FormSection>
        {!product && branches.length > 1 && (
          <FormSection title={t.services.where}>
            <Select
              name="branchId"
              label={t.services.where}
              value={branchId}
              onChange={(event) => setBranchId(event.target.value)}
            >
              <option value="">{t.services.allBranches}</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {t.services.onlyAt.replace("{branch}", b.name)}
                </option>
              ))}
            </Select>
            <p className="-mt-1 text-sm text-fg-muted">
              {t.services.whereHint}
            </p>
          </FormSection>
        )}
        {sites.length > 0 && (
          <FormSection title={text.sectionStock}>
            <StockEditor
              sites={sites}
              counts={counts}
              onChange={(id, quantity) =>
                setCounts((current) => ({ ...current, [id]: quantity }))
              }
              t={t}
            />
            <p className="-mt-1 text-sm text-fg-muted">{text.stockHint}</p>
          </FormSection>
        )}
        {action.data && !action.data.ok && (
          <Result result={action.data} t={t.common} />
        )}
        {stockAction.data && !stockAction.data.ok && (
          <Result result={stockAction.data} t={t.common} />
        )}
        <Button type="submit" disabled={pending} className="sm:w-fit">
          {product ? t.common.save : text.newProduct}
        </Button>
      </div>
      <Preview
        title={t.services.preview}
        image={product?.image ?? product?.images[0]}
        name={name.trim() || t.services.untitled}
        description={description.trim()}
        meta={category.trim()}
        clock={false}
        price={minor !== null ? money(minor) : "—"}
        icon={Package}
      />
    </form>
  );
}
