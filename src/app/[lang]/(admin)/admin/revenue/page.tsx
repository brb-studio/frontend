import { getTenant } from "@/entities/tenant/api";
import { adminSession } from "@/features/admin/access";
import { Revenue } from "@/features/admin/revenue";
import { getDictionary, getLocale } from "@/shared/i18n/dictionary";

export default async function RevenueAdminPage() {
  const locale = await getLocale();
  await adminSession("revenue", locale);
  const [dict, tenant] = await Promise.all([getDictionary(), getTenant()]);
  return (
    <div className="grid gap-6">
      <h1 className="text-title font-medium">{dict.admin.nav.revenue}</h1>
      <Revenue
        locale={locale}
        productsEnabled={tenant.productsEnabled}
        t={dict.admin}
      />
    </div>
  );
}
