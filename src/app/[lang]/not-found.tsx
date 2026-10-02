import { getDictionary, getLocale } from "@/shared/i18n/dictionary";
import { BrandMark } from "@/shared/ui/brand-mark";
import { ButtonLink } from "@/shared/ui/button";

export default async function NotFound() {
  const [dict, locale] = await Promise.all([getDictionary(), getLocale()]);

  return (
    <main
      id="main"
      className="mx-auto grid min-h-dvh max-w-md content-center justify-items-center gap-5 px-6 text-center"
    >
      <BrandMark size="lg" />
      <p className="text-accent-text font-medium text-6xl">404</p>
      <h1 className="font-medium text-title">{dict.notFound.title}</h1>
      <p className="text-fg-muted">{dict.notFound.body}</p>
      <ButtonLink href={`/${locale}/home`}>{dict.notFound.home}</ButtonLink>
    </main>
  );
}
