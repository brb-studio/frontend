import { redirect } from "next/navigation";
import { getLocale } from "@/shared/i18n/dictionary";

/** Products live in the services menu now; keep old links working. */
export default async function ProductsPage({
  searchParams,
}: PageProps<"/[lang]/products">) {
  const [{ branch }, locale] = await Promise.all([searchParams, getLocale()]);
  const query =
    typeof branch === "string" ? `?branch=${encodeURIComponent(branch)}` : "";
  redirect(`/${locale}/services${query}#products`);
}
