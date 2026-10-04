import { adminSession } from "@/features/admin/access";
import { TimeOffManager } from "@/features/admin/time-off-manager";
import { getDictionary, getLocale } from "@/shared/i18n/dictionary";

export default async function TimeOffAdminPage() {
  const locale = await getLocale();
  const session = await adminSession("timeOff", locale);
  const dict = await getDictionary();
  return (
    <div className="grid gap-6">
      <h1 className="text-title font-medium">{dict.admin.nav.timeOff}</h1>
      <TimeOffManager
        t={dict.admin}
        canCloseBranch={session.role !== "barber"}
      />
    </div>
  );
}
