import { adminSession } from "@/features/admin/access";
import { EarningsManager } from "@/features/admin/earnings-manager";
import { getDictionary, getLocale } from "@/shared/i18n/dictionary";

/** Commission rates and payments to this barbershop's barbers (owner and admin). */
export default async function EarningsAdminPage() {
  const locale = await getLocale();
  await adminSession("earnings", locale);
  const dict = await getDictionary();
  return (
    <div className="grid gap-6">
      <h1 className="text-title font-medium">{dict.admin.nav.earnings}</h1>
      <EarningsManager locale={locale} t={dict.platform} />
    </div>
  );
}
