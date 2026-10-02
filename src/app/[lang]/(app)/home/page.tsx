import { ArrowRight, ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getBarbers } from "@/entities/barber/api";
import { getServices } from "@/entities/service/api";
import { ServiceCard } from "@/entities/service/service-card";
import { getTenant } from "@/entities/tenant/api";
import { BranchPicker } from "@/features/branch-picker/branch-picker";
import { getDictionary, getLocale } from "@/shared/i18n/dictionary";
import { formatHours } from "@/shared/i18n/format";
import { alternates } from "@/shared/i18n/locales";
import { formatMoney } from "@/shared/i18n/money";
import { ButtonLink } from "@/shared/ui/button";

export async function generateMetadata(): Promise<Metadata> {
  const [dict, locale] = await Promise.all([getDictionary(), getLocale()]);
  return { title: dict.nav.home, alternates: alternates(locale, "/home") };
}

export default async function HomePage() {
  const locale = await getLocale();
  const [dict, tenant, services, barbers] = await Promise.all([
    getDictionary(),
    getTenant(),
    getServices(locale),
    getBarbers(locale),
  ]);

  return (
    <div className="grid gap-8">
      <header className="grid animate-rise gap-1">
        <p className="text-fg-muted">{dict.home.greeting}</p>
        <h1 className="font-medium text-title text-balance">
          {dict.home.lead}
        </h1>
      </header>

      <section
        aria-labelledby="hero-title"
        className="relative isolate grid min-h-52 animate-rise content-between gap-6 overflow-hidden rounded-[2rem] bg-neutral-950 p-6 text-white shadow-soft [animation-delay:80ms] sm:min-h-72 sm:p-8"
      >
        <Image
          src={tenant.coverImage}
          alt=""
          fill
          preload
          sizes="(min-width: 48rem) 46rem, 100vw"
          className="-z-20 object-cover object-[70%_40%]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-linear-to-r from-black/90 via-black/55 to-black/0"
        />
        <h2
          id="hero-title"
          className="max-w-[13ch] text-2xl font-semibold leading-tight sm:text-4xl"
        >
          {dict.home.heroTitle}
        </h2>
        <ButtonLink href={`/${locale}/services`} className="justify-self-start">
          {dict.home.book}
          <ArrowRight size={18} aria-hidden="true" />
        </ButtonLink>
      </section>

      <BranchPicker
        className="animate-rise [animation-delay:160ms]"
        labels={dict.branch}
        branches={tenant.branches.map((b) => ({
          slug: b.slug,
          name: b.name,
          address: b.address,
          phone: b.phone,
          mapsUrl: b.mapsUrl,
          hours: formatHours(b.hours, locale),
        }))}
      />

      <section
        aria-labelledby="popular-title"
        className="grid animate-rise gap-4 [animation-delay:240ms]"
      >
        <div className="flex items-end justify-between gap-4">
          <h2 id="popular-title" className="text-xl font-medium">
            {dict.home.services}
          </h2>
          <Link
            href={`/${locale}/services`}
            className="flex items-center gap-1 text-sm text-accent-text"
          >
            {dict.home.seeAll}
            <ChevronRight size={16} aria-hidden="true" />
          </Link>
        </div>
        <ul className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-4 [scrollbar-width:none]">
          {services.map((service) => (
            <ServiceCard
              key={service.slug}
              className="w-44 shrink-0 snap-start sm:w-56"
              sizes="(min-width: 40rem) 14rem, 11rem"
              service={service}
              href={`/${locale}/services/${service.slug}`}
              price={formatMoney(service.price, tenant.currency, locale)}
              minutesLabel={dict.services.minutes}
            />
          ))}
        </ul>
      </section>

      <section
        aria-labelledby="team-title"
        className="grid animate-rise gap-4 [animation-delay:320ms]"
      >
        <h2 id="team-title" className="text-xl font-medium">
          {dict.home.team}
        </h2>
        <ul className="-mx-4 flex gap-6 overflow-x-auto px-4 [scrollbar-width:none]">
          {barbers.map((barber) => (
            <li
              key={barber.slug}
              className="grid w-24 shrink-0 justify-items-center gap-2 text-center"
            >
              <span
                aria-hidden="true"
                className="bg-accent grid size-20 place-items-center rounded-full p-0.5"
              >
                <span className="grid size-full place-items-center rounded-full bg-surface font-medium text-2xl text-accent-text">
                  {barber.name.charAt(0)}
                </span>
              </span>
              <span className="font-medium">{barber.name}</span>
              <span className="text-xs text-fg-muted">{barber.specialty}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
