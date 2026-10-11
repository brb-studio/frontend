import { adminSession } from "@/features/admin/access";
import { BillingPanel } from "@/features/billing/billing-panel";
import { getBilling } from "@/features/billing/data";
import { getDictionary, getLocale } from "@/shared/i18n/dictionary";

export default async function BillingAdminPage() {
  const locale = await getLocale();
  await adminSession("billing", locale);
  const [dict, billing] = await Promise.all([getDictionary(), getBilling()]);
  return (
    <div className="grid gap-6">
      <h1 className="text-title font-medium">{dict.admin.billing.title}</h1>
      <BillingPanel billing={billing} lang={locale} t={dict.admin.billing} />
    </div>
  );
}
