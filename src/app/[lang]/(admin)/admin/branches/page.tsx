import { adminSession } from "@/features/admin/access";
import { BranchesManager } from "@/features/admin/branches-manager";
import { getDictionary, getLocale } from "@/shared/i18n/dictionary";

export default async function BranchesAdminPage() {
  const locale = await getLocale();
  const session = await adminSession("branches", locale);
  const dict = await getDictionary();
  return (
    <div className="grid gap-6">
      <h1 className="text-title font-medium">{dict.admin.nav.branches}</h1>
      <BranchesManager
        locale={locale}
        t={dict.admin}
        canCreate={session.role === "owner" || session.role === "admin"}
      />
    </div>
  );
}
