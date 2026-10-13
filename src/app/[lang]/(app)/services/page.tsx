import type { Metadata } from "next";
import { getServices } from "@/entities/service/api";
import { ServiceCard } from "@/entities/service/service-card";
import { getTenant } from "@/entities/tenant/api";
import { getSession } from "@/features/auth/session";
import { ProductCatalog } from "@/features/products/catalog";
import { getCatalog } from "@/features/products/data";
import { getDictionary, getLocale } from "@/shared/i18n/dictionary";
import { alternates } from "@/shared/i18n/locales";
import { formatMoney } from "@/shared/i18n/money";
import { SectionTabs } from "@/shared/ui/section-tabs";

export async function generateMetadata(): Promise<Metadata> {
  const [dict, locale] = await Promise.all([getDictionary(), getLocale()]);
  return {
    title: dict.services.title,
    description: dict.services.lead,
    alternates: alternates(locale, "/services"),
  };
}

export default async function ServicesPage({
  searchParams,
}: PageProps<"/[lang]/services">) {
  const locale = await getLocale();
  const [query, dict, tenant, services, session] = await Promise.all([
    searchParams,
    getDictionary(),
    getTenant(),
    getServices(locale),
    getSession(),
  ]);
  const branch = tenant.productsEnabled
    ? (tenant.branches.find((b) => b.slug === query.branch) ??
      tenant.branches[0])
    : undefined;
  const catalog = branch && (await getCatalog(branch.slug));
  const t = dict.services;

  const groups = [
    {
      id: "services",
      label: t.title,
      items: services.filter((s) => s.kind === "service"),
    },
    {
      id: "packages",
      label: t.packages,
      items: services.filter((s) => s.kind === "package"),
    },
  ].filter((g) => g.items.length > 0);
  const sections = [
    ...groups,
    ...(catalog ? [{ id: "products", label: dict.products.title }] : []),
  ];

  return (
    <div className="grid gap-6">
      <header className="grid animate-rise gap-2">
        <h1 className="font-medium text-title">{t.title}</h1>
        <p className="text-fg-muted">{t.lead}</p>
      </header>
      {sections.length > 1 && (
        <SectionTabs
          label={t.sections}
          sections={sections.map(({ id, label }) => ({ id, label }))}
        />
      )}
      {groups.map((group) => (
        <section
          key={group.id}
          id={group.id}
          aria-labelledby={`${group.id}-title`}
          className="grid scroll-mt-36 animate-rise gap-4 [animation-delay:100ms]"
        >
          <h2 id={`${group.id}-title`} className="text-xl font-medium">
            {group.label}
          </h2>
          <ul className="grid grid-cols-2 gap-3 sm:gap-5">
            {group.items.map((service) => (
              <ServiceCard
                key={service.slug}
                heading="h3"
                sizes="(min-width: 48rem) 23rem, 50vw"
                service={service}
                href={`/${locale}/services/${service.slug}`}
                price={formatMoney(service.price, tenant.currency, locale)}
                minutesLabel={t.minutes}
              />
            ))}
          </ul>
        </section>
      ))}
      {catalog && branch && (
        <section
          id="products"
          aria-labelledby="products-title"
          className="grid scroll-mt-36 gap-4"
        >
          <div className="grid gap-1">
            <h2 id="products-title" className="text-xl font-medium">
              {dict.products.title}
            </h2>
            <p className="text-sm text-fg-muted">{dict.products.lead}</p>
          </div>
          <ProductCatalog
            catalog={catalog}
            branches={tenant.branches.map((b) => ({
              slug: b.slug,
              name: b.name,
            }))}
            initialBranch={branch.slug}
            signedIn={session?.role === "customer"}
            locale={locale}
            t={dict.products}
          />
        </section>
      )}
    </div>
  );
}
