import { type NextRequest, NextResponse } from "next/server";
import { isMarketingHost, requestHostOf } from "@/shared/api/marketing-host";
import { locales, matchLocale } from "@/shared/i18n/locales";

/** The marketing tree lives under /site/{lang}; its public URLs are /{lang}/… on a marketing host. */
const SITE = "/site";
/** Generated metadata images of the marketing tree keep their physical URL (Next links them there). */
const SITE_IMAGE =
  /^\/site\/(?:en|es)\/(?:opengraph|twitter)-image(?:[-/][\w-]*)?$/;
/**
 * Marks our own rewrite. When Next is bound to a loopback IP (`next start --hostname 127.0.0.1`),
 * NextURL normalizes the request origin to `localhost`, so the rewrite no longer matches the bound
 * origin and Next replays it as an external request to /site/…, which comes back through here.
 * The per-process secret lets that hop through; a visitor asking for /site/… directly can't send it.
 */
export const SITE_REWRITE_HEADER = "x-brb-site-rewrite";
const SITE_REWRITE_TOKEN = crypto.randomUUID();

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const marketing = isMarketingHost(requestHostOf(request.headers));

  if (pathname === SITE || pathname.startsWith(`${SITE}/`)) {
    if (marketing && SITE_IMAGE.test(pathname)) return;
    if (
      marketing &&
      request.headers.get(SITE_REWRITE_HEADER) === SITE_REWRITE_TOKEN
    ) {
      return;
    }
    return new NextResponse("Not Found", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const locale = locales.find(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`),
  );

  if (!locale) {
    const preferred = matchLocale(request.headers.get("accept-language"));
    const response = redirect(
      request,
      `/${preferred}${pathname === "/" ? "" : pathname}`,
    );
    response.headers.set("Vary", "Accept-Language");
    return response;
  }

  if (marketing) {
    const url = request.nextUrl.clone();
    url.pathname = `${SITE}${pathname}`;
    url.search = search;
    const headers = new Headers(request.headers);
    headers.set(SITE_REWRITE_HEADER, SITE_REWRITE_TOKEN);
    return NextResponse.rewrite(url, { request: { headers } });
  }
}

function redirect(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/|api/|pwa/|icon|apple-icon|.*\\..*).*)"],
};
