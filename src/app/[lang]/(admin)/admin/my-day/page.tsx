import { adminSession } from "@/features/admin/access";
import { MyDay } from "@/features/admin/my-day";
import { getPushKey } from "@/features/staff/data";
import { LiveDesk } from "@/features/staff/live-desk";
import { PushToggle } from "@/features/staff/push-toggle";
import { getDictionary, getLocale } from "@/shared/i18n/dictionary";

export default async function MyDayPage() {
  const locale = await getLocale();
  await adminSession("myDay", locale);
  const [dict, pushKey] = await Promise.all([getDictionary(), getPushKey()]);
  return (
    <div className="grid gap-6">
      <h1 className="text-title font-medium">{dict.admin.nav.myDay}</h1>
      <MyDay locale={locale} t={dict.admin} status={dict.account.status} />
      {pushKey && <PushToggle publicKey={pushKey} t={dict.account.push} />}
      <LiveDesk locale={locale} t={dict.account} showAgenda={false} />
    </div>
  );
}
