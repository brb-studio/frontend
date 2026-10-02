import { type NextRequest, NextResponse } from "next/server";
import { locales, matchLocale } from "@/shared/i18n/locales";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const locale = locales.find(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`),
  );

  if (locale) return;

  const preferred = matchLocale(request.headers.get("accept-language"));
  const response = redirect(
    request,
    `/${preferred}${pathname === "/" ? "" : pathname}`,
  );
  response.headers.set("Vary", "Accept-Language");
  return response;
}

function redirect(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/|.*\\..*).*)"],
};
