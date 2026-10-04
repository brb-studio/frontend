import { LogOut } from "lucide-react";
import { adminSession } from "@/features/admin/access";
import { logout } from "@/features/auth/actions";
import { PasswordForm } from "@/features/auth/password-form";
import { getDictionary, getLocale } from "@/shared/i18n/dictionary";
import { Button } from "@/shared/ui/button";

/** The signed-in team member: who they are, password, sign out. */
export default async function AdminAccount() {
  const locale = await getLocale();
  const session = await adminSession("account", locale);
  const dict = await getDictionary();
  return (
    <div className="grid max-w-xl gap-6">
      <h1 className="text-title font-medium">{dict.admin.nav.account}</h1>
      <section className="flex items-center gap-4 rounded-[2rem] border border-line bg-card p-6">
        <span
          aria-hidden="true"
          className="grid size-14 shrink-0 place-items-center rounded-full bg-accent text-xl font-medium text-accent-fg"
        >
          {session.name.charAt(0)}
        </span>
        <div className="grid min-w-0">
          <p className="truncate font-medium">{session.name}</p>
          <p className="truncate text-sm text-fg-muted">{session.email}</p>
          <p className="text-sm text-fg-muted">
            {dict.admin.team.roles[session.role]}
          </p>
        </div>
      </section>
      <PasswordForm t={dict.auth} text={dict.account.password} />
      <form action={logout}>
        <input type="hidden" name="lang" value={locale} />
        <Button type="submit" variant="secondary" className="w-full">
          <LogOut size={18} aria-hidden="true" />
          {dict.account.logout}
        </Button>
      </form>
    </div>
  );
}
