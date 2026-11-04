import {
  CircleAlert,
  LogOut,
  Mail,
  MapPin,
  ShieldCheck,
  Store,
  UserRound,
} from "lucide-react";
import * as z from "zod";
import { getTenant } from "@/entities/tenant/api";
import { adminSession } from "@/features/admin/access";
import { initials } from "@/features/admin/initials";
import { logout } from "@/features/auth/actions";
import { PasswordForm } from "@/features/auth/password-form";
import { backend } from "@/shared/api/backend";
import { getDictionary, getLocale } from "@/shared/i18n/dictionary";
import { Button } from "@/shared/ui/button";

const branchName = z.object({ name: z.string() });

/** The branch's name for a manager or a barber; nothing if it can't be read right now. */
async function branchOf(id?: string) {
  if (!id) return null;
  try {
    return (await backend(`/v1/branches/${id}`, branchName)).name;
  } catch {
    return null;
  }
}

export default async function AdminAccount() {
  const locale = await getLocale();
  const session = await adminSession("account", locale);
  const [dict, tenant, branch] = await Promise.all([
    getDictionary(),
    getTenant(),
    branchOf(session.branchId),
  ]);
  const text = dict.admin.myAccount;
  const role = session.role === "customer" ? "barber" : session.role;
  return (
    <div className="grid max-w-2xl gap-6">
      <div className="grid gap-2">
        <h1 className="text-title font-medium">{dict.admin.nav.account}</h1>
        <p className="text-sm text-fg-muted">{text.lead}</p>
      </div>

      <section className="grid gap-5 rounded-[2rem] border border-line bg-card p-6">
        <div className="flex items-center gap-4">
          <span
            aria-hidden="true"
            className="grid size-16 shrink-0 place-items-center rounded-2xl bg-accent text-xl font-semibold text-accent-fg"
          >
            {initials(session.name)}
          </span>
          <div className="grid min-w-0 gap-1">
            <p className="truncate text-lg font-medium">{session.name}</p>
            <p>
              <span className="rounded-full border border-line px-2.5 py-0.5 text-xs text-fg-muted">
                {dict.admin.team.roles[session.role]}
              </span>
            </p>
          </div>
        </div>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div className="grid gap-0.5">
            <dt className="flex items-center gap-1.5 text-fg-muted">
              <Mail size={14} aria-hidden="true" />
              {dict.admin.team.email}
            </dt>
            <dd className="break-all">{session.email}</dd>
            <dd
              className={`flex items-center gap-1 text-xs ${session.emailVerified ? "text-accent-text" : "text-danger"}`}
            >
              {session.emailVerified ? (
                <ShieldCheck size={14} aria-hidden="true" />
              ) : (
                <CircleAlert size={14} aria-hidden="true" />
              )}
              {session.emailVerified ? text.verified : text.unverified}
            </dd>
          </div>
          <div className="grid gap-0.5">
            <dt className="flex items-center gap-1.5 text-fg-muted">
              <Store size={14} aria-hidden="true" />
              {text.workplace}
            </dt>
            <dd>{tenant.name}</dd>
          </div>
          <div className="grid gap-0.5">
            <dt className="flex items-center gap-1.5 text-fg-muted">
              <MapPin size={14} aria-hidden="true" />
              {text.branch}
            </dt>
            <dd>{session.branchId ? (branch ?? "—") : text.everyBranch}</dd>
          </div>
        </dl>
      </section>

      <section className="grid gap-2 rounded-[2rem] border border-line bg-card p-6">
        <h2 className="flex items-center gap-2 font-medium">
          <UserRound size={18} aria-hidden="true" className="text-accent" />
          {text.accessTitle}
        </h2>
        <p className="text-sm">{dict.admin.team.roleHelp[role]}</p>
        {session.role !== "owner" && (
          <p className="text-sm text-fg-muted">{text.changeData}</p>
        )}
      </section>

      <PasswordForm
        t={dict.auth}
        text={dict.account.password}
        lead={text.passwordLead}
      />

      <section className="grid gap-4 rounded-[2rem] border border-line bg-card p-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <div className="grid gap-0.5">
          <h2 className="font-medium">{text.sessionTitle}</h2>
          <p className="text-sm text-fg-muted">{text.sessionLead}</p>
        </div>
        <form action={logout}>
          <input type="hidden" name="lang" value={locale} />
          <Button type="submit" variant="secondary" className="w-full">
            <LogOut size={18} aria-hidden="true" />
            {dict.account.logout}
          </Button>
        </form>
      </section>
    </div>
  );
}
