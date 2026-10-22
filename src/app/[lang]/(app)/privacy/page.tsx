import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getTenant } from "@/entities/tenant/api";
import { getDictionary, getLocale } from "@/shared/i18n/dictionary";
import { alternates } from "@/shared/i18n/locales";

const UPDATED = "2026-10-22";

export async function generateMetadata(): Promise<Metadata> {
  const [dict, locale] = await Promise.all([getDictionary(), getLocale()]);
  return {
    title: dict.privacy.title,
    alternates: alternates(locale, "/privacy"),
  };
}

function Part({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid gap-3">
      <h2 className="text-lg font-medium text-fg">{title}</h2>
      {children}
    </section>
  );
}

function Bullets({ items }: { items: readonly string[] }) {
  return (
    <ul className="grid list-outside list-disc gap-2 pl-5">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export default async function PrivacyPage() {
  const [dict, locale, tenant] = await Promise.all([
    getDictionary(),
    getLocale(),
    getTenant(),
  ]);
  const t = dict.privacy;
  const updated = new Intl.DateTimeFormat(locale, {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(`${UPDATED}T00:00:00Z`));

  return (
    <article className="grid gap-8">
      <header className="grid animate-rise gap-2">
        <h1 className="font-medium text-title">{t.title}</h1>
        <p className="text-sm text-fg-muted">
          {t.updated.replace("{date}", updated)}
        </p>
      </header>
      <div className="grid animate-rise gap-8 rounded-[2rem] border border-line bg-card p-6 text-fg-muted shadow-soft [animation-delay:80ms]">
        <Part title={t.controller.title}>
          <p>{t.controller.body.replace("{shop}", tenant.name)}</p>
          <ul className="grid gap-2">
            {tenant.branches.map((branch) => (
              <li key={branch.slug}>
                <span className="font-medium text-fg">{branch.name}</span>
                {" · "}
                {branch.address.join(", ")}
                {branch.phone && (
                  <>
                    {" · "}
                    <a
                      href={`tel:${branch.phone}`}
                      className="underline-offset-4 hover:underline"
                    >
                      {branch.phoneDisplay}
                    </a>
                  </>
                )}
              </li>
            ))}
          </ul>
        </Part>
        <Part title={t.data.title}>
          <Bullets items={t.data.body} />
        </Part>
        <Part title={t.purposes.title}>
          <Bullets items={t.purposes.body} />
          <p>{t.purposes.note}</p>
        </Part>
        <Part title={t.processors.title}>
          <p>{t.processors.body}</p>
        </Part>
        <Part title={t.limit.title}>
          <p>{t.limit.body}</p>
        </Part>
        <Part title={t.rights.title}>
          <p>{t.rights.body}</p>
          <Bullets items={[t.rights.access, t.rights.erase, t.rights.other]} />
        </Part>
        <Part title={t.changes.title}>
          <p>{t.changes.body}</p>
        </Part>
      </div>
    </article>
  );
}
