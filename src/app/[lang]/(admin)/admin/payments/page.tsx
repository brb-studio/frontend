import { adminSession } from "@/features/admin/access";
import { PaymentsManager } from "@/features/admin/payments-manager";
import { getDictionary, getLocale } from "@/shared/i18n/dictionary";

export default async function PaymentsAdminPage({
  searchParams,
}: PageProps<"/[lang]/admin/payments">) {
  const [locale, query] = await Promise.all([getLocale(), searchParams]);
  const stripeReturn =
    query.stripe === "return" || query.stripe === "refresh"
      ? query.stripe
      : undefined;
  await adminSession("payments", locale);
  const dict = await getDictionary();
  return (
    <div className="grid gap-6">
      <h1 className="text-title font-medium">{dict.admin.nav.payments}</h1>
      <PaymentsManager
        locale={locale}
        stripeReturn={stripeReturn}
        t={dict.admin}
      />
    </div>
  );
}
