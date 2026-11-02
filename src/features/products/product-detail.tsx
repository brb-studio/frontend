"use client";

import { Package, Plus } from "lucide-react";
import { Sheet, SheetActions } from "@/features/payments/sheet";
import type { Dictionary } from "@/shared/i18n/en";
import type { Locale } from "@/shared/i18n/locales";
import { pick } from "@/shared/i18n/localized";
import { Button } from "@/shared/ui/button";
import { ZoomGallery } from "@/shared/ui/photo-viewer";
import type { Catalog } from "./model";

export function ProductDetail({
  product,
  price,
  onAdd,
  onClose,
  locale,
  t,
}: {
  product: Catalog["products"][number] | undefined;
  price: string;
  onAdd: () => void;
  onClose: () => void;
  locale: Locale;
  t: Dictionary["products"];
}) {
  return (
    <Sheet
      open={product !== undefined}
      onClose={onClose}
      title={product ? pick(product.name, locale) : ""}
      icon={<Package size={18} aria-hidden="true" />}
      closeLabel={t.close}
    >
      {product && (
        <div className="grid gap-4">
          {product.images.length > 0 && (
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-surface">
              <ZoomGallery
                images={product.images}
                sizes="(min-width: 40rem) 36rem, 100vw"
                closeLabel={t.close}
                className="flex size-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none]"
              />
              {product.images.length > 1 && (
                <span className="pointer-events-none absolute right-3 bottom-3 rounded-full bg-black/55 px-3 py-1 text-xs font-medium text-white">
                  {product.images.length} {t.photos}
                </span>
              )}
            </div>
          )}
          <div className="grid gap-1">
            <p className="text-lg font-medium">{price}</p>
            {product.category && (
              <p className="text-sm text-fg-muted">{product.category}</p>
            )}
            {product.description && (
              <p className="mt-2 text-fg-muted">
                {pick(product.description, locale)}
              </p>
            )}
            {!product.available && (
              <p className="text-sm text-fg-muted">{t.soldOut}</p>
            )}
          </div>
          {product.available && (
            <SheetActions>
              <Button type="button" onClick={onAdd}>
                <Plus size={18} aria-hidden="true" />
                {t.add}
              </Button>
            </SheetActions>
          )}
        </div>
      )}
    </Sheet>
  );
}
