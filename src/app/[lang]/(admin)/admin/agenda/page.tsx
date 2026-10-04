import { adminSession } from "@/features/admin/access";
import { AgendaManager } from "@/features/admin/agenda-manager";
import { getDictionary, getLocale } from "@/shared/i18n/dictionary";

export default async function AgendaPage() {
  const locale = await getLocale();
  await adminSession("agenda", locale);
  const dict = await getDictionary();
  return (
    <div className="grid gap-6">
      <h1 className="text-title font-medium">{dict.admin.nav.agenda}</h1>
      <AgendaManager
        locale={locale}
        t={dict.admin}
        status={dict.account.status}
      />
    </div>
  );
}
