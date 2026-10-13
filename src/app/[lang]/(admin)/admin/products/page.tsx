import { getTenant } from "@/entities/tenant/api";
import { adminSession } from "@/features/admin/access";
import { ProductsManager } from "@/features/admin/products-manager";
import { getDictionary, getLocale } from "@/shared/i18n/dictionary";

export default async function ProductsAdminPage() {
  const locale = await getLocale();
  await adminSession("products", locale);
  const [dict, tenant] = await Promise.all([getDictionary(), getTenant()]);
  return (
    <div className="grid gap-6">
      <h1 className="text-title font-medium">{dict.admin.nav.products}</h1>
      <ProductsManager
        locale={locale}
        currency={tenant.currency}
        t={dict.admin}
      />
    </div>
  );
}
