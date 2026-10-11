import { notFound, redirect } from "next/navigation";
import { getSession } from "@/features/auth/session";
import type { Locale } from "@/shared/i18n/locales";
import { type Section, sectionsFor } from "./sections";

export async function adminSession(section: Section, locale: Locale) {
  const session = await getSession();
  if (!session) redirect(`/${locale}/login`);
  if (!sectionsFor(session.role).includes(section)) notFound();
  return session;
}
