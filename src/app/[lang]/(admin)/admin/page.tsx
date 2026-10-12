import { redirect } from "next/navigation";
import { getTenant } from "@/entities/tenant/api";
import { adminSession } from "@/features/admin/access";
import { TodayStats } from "@/features/admin/today-stats";
import { getSession } from "@/features/auth/session";
import { getPushKey } from "@/features/staff/data";
import { LiveDesk } from "@/features/staff/live-desk";
import { PushToggle } from "@/features/staff/push-toggle";
import { getDictionary, getLocale } from "@/shared/i18n/dictionary";

export default async function AdminHome() {
  const locale = await getLocale();
  // Barbers live in "My day": their own cuts, alerts and nothing else.
  if ((await getSession())?.role === "barber") {
    redirect(`/${locale}/admin/my-day`);
  }
  const session = await adminSession("home", locale);
  const [dict, pushKey, tenant] = await Promise.all([
    getDictionary(),
    getPushKey(),
    getTenant(),
  ]);
  const date = new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
  return (
    <div className="grid gap-6">
      <header className="grid gap-1">
        <p className="text-sm capitalize text-fg-muted">{date}</p>
        <h1 className="text-title font-medium">
          {dict.admin.home.greeting}, {session.name.split(" ")[0]}
        </h1>
      </header>
      <TodayStats
        locale={locale}
        currency={tenant.currency}
        t={dict.admin.home}
      />
      {pushKey && <PushToggle publicKey={pushKey} t={dict.account.push} />}
      <LiveDesk locale={locale} t={dict.account} />
    </div>
  );
}
