import { adminSession } from "@/features/admin/access";
import { BarbersManager } from "@/features/admin/barbers-manager";
import { getDictionary, getLocale } from "@/shared/i18n/dictionary";

export default async function BarbersAdminPage() {
  const locale = await getLocale();
  const session = await adminSession("barbers", locale);
  const dict = await getDictionary();
  return (
    <div className="grid gap-6">
      <h1 className="text-title font-medium">{dict.admin.nav.barbers}</h1>
      <BarbersManager
        locale={locale}
        t={dict.admin}
        canCreate={session.role !== "barber"}
      />
    </div>
  );
}
