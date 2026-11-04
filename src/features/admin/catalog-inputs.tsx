"use client";

import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { Field } from "@/shared/ui/field";
import { ImagesField } from "./image-field";
import type { AdminService } from "./schemas";
import { type AdminText, slugify, value } from "./ui";

export function both(form: FormData, es: string, en: string) {
  const textEs = value(form, es);
  const textEn = value(form, en);
  if (!textEs && !textEn) return undefined;
  return {
    ...(textEs ? { es: textEs } : {}),
    ...(textEn ? { en: textEn } : {}),
  };
}

export function commonFields(form: FormData, isNew: boolean) {
  const name = both(form, "nameEs", "nameEn");
  const description = both(form, "descriptionEs", "descriptionEn");
  return {
    name,
    ...(description ? { description } : {}),
    images: form.getAll("images").map(String),
    ...(isNew
      ? { slug: value(form, "slug") || slugify(name?.es ?? name?.en ?? "") }
      : {}),
  };
}

/** A titled part of a catalog form. */
export function FormSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <fieldset className="grid min-w-0 gap-3">
      <legend className="mb-3 text-sm font-medium text-accent-text">
        {title}
      </legend>
      {children}
    </fieldset>
  );
}

/** Folded extras: open on demand, but their fields are still sent with the form. */
export function Fold({
  title,
  open = false,
  children,
}: {
  title: string;
  open?: boolean;
  children: ReactNode;
}) {
  return (
    <details open={open} className="group grid gap-3">
      <summary className="flex min-h-11 w-fit cursor-pointer list-none items-center gap-2 text-sm text-fg-muted hover:text-fg [&::-webkit-details-marker]:hidden">
        <ChevronDown
          size={16}
          aria-hidden="true"
          className="transition-transform group-open:rotate-180"
        />
        {title}
      </summary>
      <div className="mt-3 grid gap-3">{children}</div>
    </details>
  );
}

/**
 * Photos, name and description: Spanish up front, English folded (open when it already has text),
 * and the URL name under "Advanced" (only when creating). Shared by services, packages and products.
 */
export function CommonInputs({
  item,
  kind,
  t,
}: {
  item?: Pick<AdminService, "name" | "description" | "images">;
  kind: "services" | "packages" | "products";
  t: AdminText;
}) {
  const hasEnglish = Boolean(item?.name.en || item?.description?.en);
  return (
    <>
      <ImagesField
        kind={kind}
        label={t.images.photo}
        defaultValue={item?.images}
        t={t.images}
      />
      <FormSection title={t.services.sectionName}>
        <Field
          name="nameEs"
          label={t.common.nameEs}
          required
          maxLength={80}
          defaultValue={item?.name.es}
        />
        <Field
          name="descriptionEs"
          label={t.common.descriptionEs}
          maxLength={500}
          defaultValue={item?.description?.es}
        />
        <Fold title={t.common.addEnglish} open={hasEnglish}>
          <Field
            name="nameEn"
            label={t.common.nameEn}
            maxLength={80}
            defaultValue={item?.name.en}
          />
          <Field
            name="descriptionEn"
            label={t.common.descriptionEn}
            maxLength={500}
            defaultValue={item?.description?.en}
          />
        </Fold>
        {!item && (
          <Fold title={t.common.advanced}>
            <Field name="slug" label={t.common.slug} hint={t.common.slugHint} />
          </Fold>
        )}
      </FormSection>
    </>
  );
}
