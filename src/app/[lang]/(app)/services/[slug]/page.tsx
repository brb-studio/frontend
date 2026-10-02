import { ChevronLeft, Clock, Tag } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { getService, getServices } from "@/entities/service/api";
import { ServiceCard } from "@/entities/service/service-card";
import { getTenant } from "@/entities/tenant/api";
import { getBookingOptions } from "@/features/booking/availability";
import { BookingForm } from "@/features/booking/booking-form";
import { getDictionary, getLocale } from "@/shared/i18n/dictionary";
import { alternates } from "@/shared/i18n/locales";
import { formatMoney } from "@/shared/i18n/money";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/services/[slug]">): Promise<Metadata> {
  const [{ slug }, locale] = await Promise.all([params, getLocale()]);
  const service = await getService(slug, locale);
  if (!service) return {};
  return {
    title: service.name,
    description: service.description,
    alternates: alternates(locale, `/services/${slug}`),
  };
}

export default async function ServicePage({
  params,
}: PageProps<"/[lang]/services/[slug]">) {
  await connection();
  const [{ slug }, locale] = await Promise.all([params, getLocale()]);
  const [dict, tenant, services] = await Promise.all([
    getDictionary(),
    getTenant(),
    getServices(locale),
  ]);
  const service = services.find((s) => s.slug === slug);
  if (!service) notFound();
  const booking = await getBookingOptions(service.durationMin, locale);
  const price = (minor: number) => formatMoney(minor, tenant.currency, locale);
  const others = services.filter((s) => s.slug !== slug);

  return (
    <div className="grid gap-8">
      <div className="-mx-4 -mt-6 md:mx-0 md:mt-0">
        <div className="relative isolate aspect-[4/3] animate-rise overflow-hidden md:aspect-[16/9] md:rounded-[2rem] md:shadow-soft">
          <Image
            src={service.image}
            alt=""
            fill
            preload
            sizes="(min-width: 48rem) 46rem, 100vw"
            className="-z-20 object-cover"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-linear-to-b from-black/35 to-black/0 to-40%"
          />
          <Link
            href={`/${locale}/services`}
            className="absolute left-4 top-4 grid size-11 place-items-center rounded-full border border-white/20 bg-white/15 text-white backdrop-blur-xl transition-colors hover:bg-white/25"
          >
            <ChevronLeft size={20} aria-hidden="true" />
            <span className="sr-only">{dict.services.all}</span>
          </Link>
        </div>
        <div className="relative -mt-8 grid animate-sheet gap-2 rounded-t-[2rem] bg-canvas px-4 pt-7 md:mt-8 md:rounded-none md:px-0 md:pt-0">
          <h1 className="text-title font-medium">{service.name}</h1>
          <p className="max-w-md text-fg-muted">{service.description}</p>
        </div>
      </div>

      <dl className="grid animate-rise grid-cols-2 gap-3 [animation-delay:100ms]">
        <div className="grid gap-1 rounded-3xl border border-line bg-card p-5">
          <dt className="flex items-center gap-2 text-sm text-fg-muted">
            <Clock size={16} aria-hidden="true" className="text-accent-text" />
            {dict.services.duration}
          </dt>
          <dd className="text-2xl font-semibold">
            {service.durationMin} {dict.services.minutes}
          </dd>
        </div>
        <div className="grid gap-1 rounded-3xl border border-line bg-card p-5">
          <dt className="flex items-center gap-2 text-sm text-fg-muted">
            <Tag size={16} aria-hidden="true" className="text-accent-text" />
            {dict.services.price}
          </dt>
          <dd className="text-2xl font-semibold">{price(service.price)}</dd>
        </div>
      </dl>

      <div className="animate-rise [animation-delay:160ms]">
        <BookingForm
          lang={locale}
          service={service.slug}
          serviceName={service.name}
          options={booking}
          t={dict.booking}
        />
      </div>

      {others.length > 0 && (
        <section
          aria-labelledby="others-title"
          className="grid animate-rise gap-4 [animation-delay:220ms]"
        >
          <h2 id="others-title" className="text-xl font-medium">
            {dict.services.others}
          </h2>
          <ul className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-4 [scrollbar-width:none]">
            {others.map((other) => (
              <ServiceCard
                key={other.slug}
                className="w-44 shrink-0 snap-start sm:w-56"
                sizes="(min-width: 40rem) 14rem, 11rem"
                service={other}
                href={`/${locale}/services/${other.slug}`}
                price={price(other.price)}
                minutesLabel={dict.services.minutes}
              />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
