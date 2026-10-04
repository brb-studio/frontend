import { adminSession } from "@/features/admin/access";
import { SettingsForm } from "@/features/admin/settings-form";
import { getDictionary, getLocale } from "@/shared/i18n/dictionary";

export default async function SettingsAdminPage() {
  const locale = await getLocale();
  await adminSession("settings", locale);
  const dict = await getDictionary();
  return (
    <div className="grid gap-6">
      <h1 className="text-title font-medium">{dict.admin.nav.settings}</h1>
      <SettingsForm t={dict.admin} />
    </div>
  );
}
