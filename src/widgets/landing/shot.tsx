import Image from "next/image";
import type { CSSProperties } from "react";
import type { LandingDictionary } from "@/shared/i18n/landing";
import type { Locale } from "@/shared/i18n/locales";
import { resolveShot, SHOTS } from "./shots";

type Props = {
  id: keyof typeof SHOTS;
  locale: Locale;
  t: LandingDictionary;
  /** Largest rendered width, for `sizes`. */
  maxWidth?: number;
  eager?: boolean;
  className?: string;
};

/**
 * A real capture in a minimal device frame. Until the capture exists it renders the same frame,
 * empty, with a caption: never a drawn imitation of the UI.
 */
export function ShotFrame({
  id,
  locale,
  t,
  maxWidth = 360,
  eager = false,
  className = "",
}: Props) {
  const shot = resolveShot(SHOTS[id], locale);
  const alt = t.shots[id];
  const frame = `lp-frame lp-frame--${shot.device} lp-frame--${shot.scheme} ${className}`;

  return (
    <figure
      className={frame}
      style={{ "--lp-ar": `${shot.width} / ${shot.height}` } as CSSProperties}
    >
      {shot.device === "desktop" && (
        <span className="lp-frame__dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
      )}
      {shot.src ? (
        <Image
          src={shot.src}
          alt={alt}
          width={shot.width}
          height={shot.height}
          sizes={`(max-width: 640px) 90vw, ${maxWidth}px`}
          unoptimized
          loading={eager ? "eager" : "lazy"}
          fetchPriority={eager ? "high" : undefined}
          className="lp-frame__img"
        />
      ) : (
        <div
          className="lp-frame__pending"
          role="img"
          aria-label={`${t.shots.pending}: ${alt}`}
        >
          <span className="lp-mono">{t.shots.pending}</span>
          <span className="lp-frame__desc" aria-hidden="true">
            {alt}
          </span>
        </div>
      )}
    </figure>
  );
}
