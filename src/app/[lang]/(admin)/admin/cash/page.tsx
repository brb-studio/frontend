import { adminSession } from "@/features/admin/access";
import { CashDesk } from "@/features/admin/cash";
import { getDictionary, getLocale } from "@/shared/i18n/dictionary";

export default async function CashAdminPage() {
  const locale = await getLocale();
  const session = await adminSession("cash", locale);
  const dict = await getDictionary();
  return (
    <div className="flex flex-1 flex-col gap-6">
      <h1 className="text-title font-medium">{dict.admin.nav.cash}</h1>
      <CashDesk
        locale={locale}
        t={dict.admin}
        chooseBranch={session.role === "owner" || session.role === "admin"}
      />
    </div>
  );
}
