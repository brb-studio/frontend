import { notFound, redirect } from "next/navigation";
import { getTenant } from "@/entities/tenant/api";
import { getSession } from "@/features/auth/session";
import type { Locale } from "@/shared/i18n/locales";
import { type Section, sectionsFor } from "./sections";

export async function adminSession(section: Section, locale: Locale) {
  const session = await getSession();
  if (!session) redirect(`/${locale}/login`);
  const tenant = await getTenant();
  if (!sectionsFor(session.role, tenant.productsEnabled).includes(section)) {
    notFound();
  }
  return session;
}
