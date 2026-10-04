import { adminSession } from "@/features/admin/access";
import { TeamManager } from "@/features/admin/team-manager";
import { getDictionary, getLocale } from "@/shared/i18n/dictionary";

export default async function TeamAdminPage() {
  const locale = await getLocale();
  const session = await adminSession("team", locale);
  const dict = await getDictionary();
  return (
    <div className="grid gap-6">
      <h1 className="text-title font-medium">{dict.admin.nav.team}</h1>
      <TeamManager
        t={dict.admin}
        isOwner={session.role === "owner"}
        selfId={session.id}
      />
    </div>
  );
}
