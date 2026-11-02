import { ImageResponse } from "next/og";
import { landingDictionary } from "@/shared/i18n/landing";
import { hasLocale } from "@/shared/i18n/locales";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "brb-studio";

const INK = "#0e0d0c";
const IVORY = "#f4efe6";
const ASH = "#a39e95";
const EMBER = "#d9773a";

export default async function OpenGraphImage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const t = landingDictionary(hasLocale(lang) ? lang : "es");
  const [before, em, after] = t.hero.title;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px 80px",
        background: INK,
        color: IVORY,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 24,
          fontSize: 28,
          letterSpacing: 4,
          color: ASH,
        }}
      >
        <span style={{ color: IVORY, letterSpacing: 0, fontSize: 34 }}>
          brb·studio
        </span>
        <span style={{ width: 120, height: 2, background: EMBER }} />
        <span>{t.hero.eyebrow.toUpperCase()}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", fontSize: 92, lineHeight: 1 }}>
          {`${before} `}
          <span style={{ color: EMBER, marginLeft: 22 }}>{em}</span>
        </div>
        {after && (
          <div style={{ display: "flex", fontSize: 92, lineHeight: 1 }}>
            {after}
          </div>
        )}
      </div>
      <div
        style={{ display: "flex", fontSize: 30, color: ASH, letterSpacing: 2 }}
      >
        {`${t.plans.from} ${t.plans.items.monthly.price} ${t.plans.monthly} · SPEI`}
      </div>
    </div>,
    size,
  );
}
