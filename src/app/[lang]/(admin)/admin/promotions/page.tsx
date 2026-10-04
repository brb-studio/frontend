import { getTenant } from "@/entities/tenant/api";
import { adminSession } from "@/features/admin/access";
import { PromotionsManager } from "@/features/admin/promotions-manager";
import { getDictionary, getLocale } from "@/shared/i18n/dictionary";

export default async function PromotionsAdminPage() {
  const locale = await getLocale();
  await adminSession("promotions", locale);
  const [dict, tenant] = await Promise.all([getDictionary(), getTenant()]);
  return (
    <div className="grid gap-6">
      <h1 className="text-title font-medium">{dict.admin.nav.promotions}</h1>
      <PromotionsManager
        locale={locale}
        currency={tenant.currency}
        t={dict.admin}
      />
    </div>
  );
}
