import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTenant } from "@/entities/tenant/api";
import { PaymentCheckout } from "@/features/payments/checkout";
import { publishableKey } from "@/features/payments/data";
import { getDictionary, getLocale } from "@/shared/i18n/dictionary";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: dict.payment.title, robots: { index: false } };
}

/**
 * Where a payment continues: back from 3-D Secure, or "Complete payment" in My visits. Guests carry
 * their booking token in `?token=`; customers are recognized by their session.
 */
export default async function PayPage({
  params,
  searchParams,
}: PageProps<"/[lang]/pay/[id]">) {
  const [{ id }, query, locale, dict, tenant] = await Promise.all([
    params,
    searchParams,
    getLocale(),
    getDictionary(),
    getTenant(),
  ]);
  if (!/^[a-f\d]{24}$/.test(id)) notFound();
  const token =
    typeof query.token === "string" && /^[\w-]{1,64}$/.test(query.token)
      ? query.token
      : undefined;
  return (
    <section
      aria-labelledby="pay-title"
      className="mx-auto grid w-full max-w-lg animate-rise gap-5 rounded-[2rem] border border-line bg-card p-6 shadow-soft"
    >
      <h1 id="pay-title" className="text-2xl font-medium">
        {dict.payment.title}
      </h1>
      <PaymentCheckout
        appointmentId={id}
        paymentToken={token}
        publishableKey={publishableKey()}
        methods={tenant.paymentsOnline?.methods ?? ["card"]}
        lang={locale}
        t={dict.payment}
        bookAgainHref={`/${locale}/services`}
      />
    </section>
  );
}
