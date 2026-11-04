import { adminSession } from "@/features/admin/access";
import { Customers } from "@/features/admin/customers";
import { getDictionary, getLocale } from "@/shared/i18n/dictionary";

export default async function CustomersAdminPage() {
  const locale = await getLocale();
  await adminSession("customers", locale);
  const dict = await getDictionary();
  return (
    <div className="grid gap-6">
      <h1 className="text-title font-medium">{dict.admin.nav.customers}</h1>
      <Customers locale={locale} t={dict.admin} pagerText={dict.account} />
    </div>
  );
}
