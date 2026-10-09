import { LogOut } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getTenant } from "@/entities/tenant/api";
import { AdminSidebarNav, AdminTabBar } from "@/features/admin/admin-nav";
import { sectionsFor } from "@/features/admin/sections";
import { logout } from "@/features/auth/actions";
import { getSession } from "@/features/auth/session";
import { getDictionary, getLocale } from "@/shared/i18n/dictionary";
import { BrandMark } from "@/shared/ui/brand-mark";
import { Providers } from "../../providers";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: dict.admin.title, robots: { index: false, follow: false } };
}

/**
 * The team's app: its own shell (sidebar on desktop, tab bar on phones), no customer pages. Signed-out
 * visitors go to sign in; customers go back to the shop.
 */
export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [dict, locale, session, tenant] = await Promise.all([
    getDictionary(),
    getLocale(),
    getSession(),
    getTenant(),
  ]);
  if (!session) redirect(`/${locale}/login`);
  if (session.role === "customer") redirect(`/${locale}/home`);
  const t = dict.admin;
  const sections = sectionsFor(session.role);
  const signOut = (
    <form action={logout}>
      <input type="hidden" name="lang" value={locale} />
      <button
        type="submit"
        className="flex h-11 w-full items-center gap-3 rounded-2xl px-3 text-sm text-fg-muted transition-colors hover:bg-surface hover:text-fg"
      >
        <LogOut size={18} aria-hidden="true" />
        <span className="max-md:sr-only">{dict.account.logout}</span>
      </button>
    </form>
  );

  return (
    <div className="min-h-dvh md:grid md:grid-cols-[16rem_minmax(0,1fr)]">
      <a
        href="#main"
        className="sr-only z-30 rounded-full bg-fg px-4 py-2 text-canvas focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        {dict.a11y.skipToContent}
      </a>
      <aside className="sticky top-0 hidden h-dvh flex-col gap-6 overflow-y-auto border-r border-line bg-card p-4 md:flex">
        <div className="flex items-center gap-2.5 px-2 pt-2">
          <BrandMark />
          <div className="grid min-w-0">
            <span className="truncate font-medium">{tenant.name}</span>
            <span className="text-xs text-fg-muted">{t.nav.label}</span>
          </div>
        </div>
        <AdminSidebarNav
          locale={locale}
          sections={sections}
          labels={t.nav}
          groups={t.navGroups}
        />
        <div className="mt-auto grid gap-2 border-t border-line pt-4">
          <div className="grid px-3">
            <span className="truncate text-sm font-medium">{session.name}</span>
            <span className="text-xs text-fg-muted">
              {t.team.roles[session.role]}
            </span>
          </div>
          {signOut}
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-3 border-b border-line bg-canvas/85 px-4 backdrop-blur-xl md:hidden">
          <span className="flex min-w-0 items-center gap-2 font-medium">
            <BrandMark />
            <span className="truncate">{tenant.name}</span>
          </span>
          {signOut}
        </header>
        <main
          id="main"
          tabIndex={-1}
          className="mx-auto w-full max-w-5xl px-4 pt-6 pb-32 outline-none md:px-10 md:pt-10 md:pb-12"
        >
          <Providers>{children}</Providers>
        </main>
      </div>
      <AdminTabBar
        locale={locale}
        sections={sections}
        labels={t.nav}
        groups={t.navGroups}
      />
    </div>
  );
}
