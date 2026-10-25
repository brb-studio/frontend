/**
 * The marketing site (the product landing) answers only on the hosts listed in MARKETING_HOSTS.
 * Every other host is a barbershop. IP literals never match, so http://127.0.0.1 keeps resolving
 * the default tenant (CI and e2e depend on it); bare `localhost` matches only when listed.
 */

type HeaderReader = { get(name: string): string | null };

const IP_HOST = /^(\d{1,3}(\.\d{1,3}){3}|\[[\da-f:.]+\])$/i;

function split(value: string) {
  const normalized = value.trim().toLowerCase();
  const match = normalized.match(/^(\[[^\]]*\]|[^:]+)(?::(\d+))?$/);
  if (!match) return undefined;
  const hostname = (match[1] ?? "").replace(/\.$/, "");
  return { hostname, port: match[2] };
}

export function marketingHosts(list = process.env.MARKETING_HOSTS) {
  return (list ?? "")
    .split(",")
    .map((entry) => split(entry))
    .filter(
      (entry): entry is { hostname: string; port: string | undefined } =>
        !!entry?.hostname && !IP_HOST.test(entry.hostname),
    );
}

export function isMarketingHost(
  host: string | null | undefined,
  list = process.env.MARKETING_HOSTS,
) {
  const visitor = host ? split(host) : undefined;
  if (!visitor?.hostname || IP_HOST.test(visitor.hostname)) return false;
  return marketingHosts(list).some(
    (entry) =>
      entry.hostname === visitor.hostname &&
      (entry.port === undefined || entry.port === visitor.port),
  );
}

/** Same precedence as tenantHostOf: the host our own edge forwarded, else the Host header. */
export function requestHostOf(headers: HeaderReader) {
  return headers.get("x-forwarded-host") || headers.get("host") || "";
}

const DEV_MARKETING_URL = "http://www.localhost:3000";

/** Absolute origin of the marketing site, for canonical, hreflang, OG and the sitemap. */
export function marketingUrl(
  env: Record<string, string | undefined> = process.env,
) {
  const raw = env.MARKETING_URL?.trim();
  try {
    if (raw) return new URL(raw);
  } catch {
    throw new Error(`MARKETING_URL is not a valid URL: ${raw}`);
  }
  // The landing is prerendered: a missing URL would bake dev links into canonical/hreflang/OG.
  if (env.NODE_ENV === "production" && env.MARKETING_HOSTS?.trim()) {
    throw new Error(
      "MARKETING_HOSTS is set but MARKETING_URL is missing: set it at build time (see .env.example).",
    );
  }
  if (env.NODE_ENV === "production") {
    console.warn(
      `[marketing] MARKETING_URL is not set; the landing's canonical links use ${DEV_MARKETING_URL}.`,
    );
  }
  return new URL(DEV_MARKETING_URL);
}

export type MarketingContact = {
  whatsapp?: string;
  email?: string;
  showcaseUrl?: string;
};

/** Contact channels for the CTA, from server env. Any of them may be unset before launch. */
export function marketingContact(
  env: Record<string, string | undefined> = process.env,
): MarketingContact {
  const digits = (env.MARKETING_WHATSAPP ?? "").replace(/\D/g, "");
  const email = (env.MARKETING_EMAIL ?? "").trim();
  const showcase = (env.MARKETING_SHOWCASE_URL ?? "").trim();
  return {
    whatsapp: digits.length >= 10 && digits.length <= 15 ? digits : undefined,
    email: /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(email)
      ? email
      : undefined,
    showcaseUrl: /^https?:\/\/[^\s"<>]+$/i.test(showcase)
      ? showcase
      : undefined,
  };
}

export const whatsappHref = (number: string, text: string) =>
  `https://wa.me/${number}?text=${encodeURIComponent(text)}`;

export const mailtoHref = (email: string, subject: string, body: string) =>
  `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
