import Link from "next/link";
import { getLocale } from "@/shared/i18n/dictionary";
import { getLandingDictionary } from "@/shared/i18n/landing";

export default async function MarketingNotFound() {
  const [t, locale] = await Promise.all([getLandingDictionary(), getLocale()]);
  return (
    <main id="contenido" className="lp-notfound">
      <p className="lp-mono lp-notfound__code">404</p>
      <h1 className="lp-headline">{t.notFound.title}</h1>
      <p className="lp-body">{t.notFound.body}</p>
      <Link href={`/${locale}`} className="lp-button lp-button--primary">
        {t.notFound.back}
      </Link>
    </main>
  );
}
