import { getTenant } from "@/entities/tenant/api";
import { adminSession } from "@/features/admin/access";
import { AgendaManager } from "@/features/admin/agenda-manager";
import { getDictionary, getLocale } from "@/shared/i18n/dictionary";

const one = (value: string | string[] | undefined) =>
  typeof value === "string" ? value : undefined;

export default async function AgendaPage({
  searchParams,
}: PageProps<"/[lang]/admin/agenda">) {
  const [locale, query] = await Promise.all([getLocale(), searchParams]);
  const session = await adminSession("agenda", locale);
  const [dict, tenant] = await Promise.all([getDictionary(), getTenant()]);
  return (
    <div className="grid gap-6">
      <h1 className="text-title font-medium">{dict.admin.nav.agenda}</h1>
      <AgendaManager
        locale={locale}
        t={dict.admin}
        status={dict.account.status}
        ticket={dict.payment.ticket}
        canRefund={session.role === "owner" || session.role === "admin"}
        initialDay={one(query.date)}
        initialBranch={one(query.branch)}
        currency={tenant.currency}
      />
    </div>
  );
}
