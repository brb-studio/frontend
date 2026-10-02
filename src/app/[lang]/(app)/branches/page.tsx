import { Navigation, Phone } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { getTenant } from "@/entities/tenant/api";
import { getDictionary, getLocale } from "@/shared/i18n/dictionary";
import { formatHours } from "@/shared/i18n/format";
import { alternates } from "@/shared/i18n/locales";
import { buttonClass } from "@/shared/ui/button";

export async function generateMetadata(): Promise<Metadata> {
  const [dict, locale] = await Promise.all([getDictionary(), getLocale()]);
  return {
    title: dict.branches.title,
    alternates: alternates(locale, "/branches"),
  };
}

export default async function BranchesPage() {
  const [dict, locale, tenant] = await Promise.all([
    getDictionary(),
    getLocale(),
    getTenant(),
  ]);

  return (
    <div className="grid gap-8">
      <header className="grid animate-rise gap-2">
        <h1 className="font-medium text-title">{dict.branches.title}</h1>
        <p className="text-fg-muted">{dict.branches.lead}</p>
      </header>
      <ul className="grid gap-6">
        {tenant.branches.map((branch, i) => (
          <li
            key={branch.slug}
            style={{ animationDelay: `${100 + i * 80}ms` }}
            className="grid border border-line bg-card animate-rise overflow-hidden rounded-[2rem] shadow-soft sm:grid-cols-[2fr_3fr]"
          >
            <div className="relative aspect-[16/10] sm:aspect-auto">
              <Image
                src={branch.image}
                alt=""
                fill
                sizes="(min-width: 40rem) 18rem, 100vw"
                className="object-cover"
              />
            </div>
            <div className="grid gap-5 p-6">
              <div className="grid gap-1">
                <h2 className="font-medium text-2xl">{branch.name}</h2>
                <p className="text-sm text-fg-muted">
                  {branch.address.join(", ")}
                </p>
              </div>
              <div className="grid gap-2 text-sm">
                <h3 className="text-xs uppercase tracking-[0.2em] text-accent-text">
                  {dict.branch.hours}
                </h3>
                <dl className="grid gap-1">
                  {formatHours(branch.hours, locale).map((h) => (
                    <div key={h.days} className="flex justify-between gap-4">
                      <dt className="first-letter:uppercase text-fg-muted">
                        {h.days}
                      </dt>
                      <dd>{h.time}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(8.5rem,1fr))] gap-3">
                <a href={branch.mapsUrl} className={buttonClass("secondary")}>
                  <Navigation size={16} aria-hidden="true" />
                  {dict.branch.directions}
                </a>
                <a
                  href={`tel:${branch.phone}`}
                  className={buttonClass("primary")}
                >
                  <Phone size={16} aria-hidden="true" />
                  {dict.branch.call}
                </a>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
