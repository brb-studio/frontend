import type { Metadata } from "next";
import { getServices } from "@/entities/service/api";
import { ServiceCard } from "@/entities/service/service-card";
import { getTenant } from "@/entities/tenant/api";
import { getDictionary, getLocale } from "@/shared/i18n/dictionary";
import { alternates } from "@/shared/i18n/locales";
import { formatMoney } from "@/shared/i18n/money";

export async function generateMetadata(): Promise<Metadata> {
  const [dict, locale] = await Promise.all([getDictionary(), getLocale()]);
  return {
    title: dict.services.title,
    description: dict.services.lead,
    alternates: alternates(locale, "/services"),
  };
}

export default async function ServicesPage() {
  const locale = await getLocale();
  const [dict, tenant, services] = await Promise.all([
    getDictionary(),
    getTenant(),
    getServices(locale),
  ]);

  return (
    <div className="grid gap-8">
      <header className="grid animate-rise gap-2">
        <h1 className="font-medium text-title">{dict.services.title}</h1>
        <p className="text-fg-muted">{dict.services.lead}</p>
      </header>
      <ul className="grid animate-rise grid-cols-2 gap-3 [animation-delay:100ms] sm:gap-5">
        {services.map((service) => (
          <ServiceCard
            key={service.slug}
            heading="h2"
            sizes="(min-width: 48rem) 23rem, 50vw"
            service={service}
            href={`/${locale}/services/${service.slug}`}
            price={formatMoney(service.price, tenant.currency, locale)}
            minutesLabel={dict.services.minutes}
          />
        ))}
      </ul>
    </div>
  );
}
