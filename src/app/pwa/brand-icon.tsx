import { ImageResponse } from "next/og";
import { getTenant } from "@/entities/tenant/api";

const DEFAULT_ACCENT = "#ff6a1a";
const INK = "#111111";

/** The tenant's accent as a plain hex (the image renderer doesn't take every CSS color). */
async function brand() {
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

/** A square app icon: the business's initial on its accent color, safe for maskable crops. */
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
