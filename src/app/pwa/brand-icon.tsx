import { headers } from "next/headers";
import { ImageResponse } from "next/og";
import { getTenant } from "@/entities/tenant/api";
import { isMarketingHost, requestHostOf } from "@/shared/api/marketing-host";

const DEFAULT_ACCENT = "#ff6a1a";
const INK = "#111111";

const MARKETING = { letter: "b", accent: "#d9773a" };

async function brand() {
  // The product site has no tenant: use its own copper mark instead of a barbershop's.
  if (isMarketingHost(requestHostOf(await headers()))) return MARKETING;
  try {
    const tenant = await getTenant();
    const accent = tenant.theme?.accent;
    const value = typeof accent === "string" ? accent : accent?.light;
    return {
      letter: tenant.name.charAt(0).toUpperCase() || "M",
      accent: value && /^#[0-9a-f]{3,8}$/i.test(value) ? value : DEFAULT_ACCENT,
    };
  } catch {
    return { letter: "M", accent: DEFAULT_ACCENT };
  }
}

export async function brandIcon(size: number) {
  const { letter, accent } = await brand();
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: accent,
        color: INK,
        fontSize: size * 0.55,
        fontWeight: 700,
      }}
    >
      {letter}
    </div>,
    { width: size, height: size },
  );
}
