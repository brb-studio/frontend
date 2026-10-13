import { adminSession } from "@/features/admin/access";
import { Pickups } from "@/features/admin/pickups";
import { getDictionary, getLocale } from "@/shared/i18n/dictionary";

export default async function PickupsAdminPage() {
  const locale = await getLocale();
  await adminSession("pickups", locale);
  const dict = await getDictionary();
  return (
    <div className="grid gap-6">
      <h1 className="text-title font-medium">{dict.admin.nav.pickups}</h1>
      <Pickups locale={locale} t={dict.admin} />
    </div>
  );
}
