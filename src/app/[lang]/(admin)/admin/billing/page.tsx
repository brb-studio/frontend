import { adminSession } from "@/features/admin/access";
import { BillingPanel } from "@/features/billing/billing-panel";
import { getBilling } from "@/features/billing/data";
import { getDictionary, getLocale } from "@/shared/i18n/dictionary";

/** The owner pays for the app here and shares their referral code. */
export default async function BillingAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string | string[] }>;
}) {
  const locale = await getLocale();
  await adminSession("billing", locale);
  const [dict, billing, { checkout }] = await Promise.all([
    getDictionary(),
    getBilling(),
    searchParams,
  ]);
  return (
    <div className="grid gap-6">
      <h1 className="text-title font-medium">{dict.admin.billing.title}</h1>
      <BillingPanel
        billing={billing}
        lang={locale}
        returned={
          checkout === "success" || checkout === "cancel" ? checkout : undefined
        }
        t={dict.admin.billing}
      />
    </div>
  );
}
