import { getTenant } from "@/entities/tenant/api";
import { adminSession } from "@/features/admin/access";
import { ServicesManager } from "@/features/admin/services-manager";
import { getDictionary, getLocale } from "@/shared/i18n/dictionary";

export default async function ServicesAdminPage() {
  const locale = await getLocale();
  await adminSession("services", locale);
  const [dict, tenant] = await Promise.all([getDictionary(), getTenant()]);
  return (
    <div className="grid gap-6">
      <h1 className="text-title font-medium">{dict.admin.nav.services}</h1>
      <ServicesManager
        locale={locale}
        currency={tenant.currency}
        t={dict.admin}
      />
    </div>
  );
}
