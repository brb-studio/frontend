import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { cache } from "react";
import type { ShotCopyId } from "@/shared/i18n/landing-en";
import type { Locale } from "@/shared/i18n/locales";

/**
 * Real captures of the showcase tenant (Montecobre Barber Co.), produced by the screenshot pipeline
 * into public/landing/shots/. File name: `{device}-{id}-{scheme}[-{lang}].{avif|webp}`, e.g.
 * `desktop-revenue-light-es.avif`; the language suffix is optional (falls back to the unsuffixed
 * file). Optional `manifest.json` next to them gives exact sizes:
 * `[{ "file": "desktop-revenue-light-es.avif", "width": 2880, "height": 1800 }]`
 * (`w`/`h` and `{ "<file>": {…} }` are accepted too). A missing file renders a placeholder frame.
 */

export type Device = "phone" | "desktop";
export type Scheme = "light" | "dark";
export type Shot = {
  id: ShotCopyId;
  device: Device;
  scheme: Scheme;
  /** Intrinsic size used until the manifest says otherwise (a crop may differ). */
  width: number;
  height: number;
  /** Phones zoom desktop captures; 0 = left edge, 1 = right edge of the overflow. */
  focusX?: number;
};

const phone = (id: ShotCopyId, scheme: Scheme): Shot => ({
  id,
  device: "phone",
  scheme,
  width: 1170,
  height: 2532,
});
const desktop = (id: ShotCopyId, scheme: Scheme): Shot => ({
  id,
  device: "desktop",
  scheme,
  width: 2880,
  height: 1800,
});

export const SHOTS = {
  welcome: phone("welcome", "dark"),
  "booking-branch": phone("booking-branch", "dark"),
  "booking-barber": phone("booking-barber", "dark"),
  "booking-date": phone("booking-date", "dark"),
  "booking-time": phone("booking-time", "dark"),
  "booking-confirm": phone("booking-confirm", "dark"),
  "become-barber": phone("become-barber", "dark"),
  "my-day": phone("my-day", "dark"),
  branches: desktop("branches", "dark"),
  agenda: desktop("agenda", "dark"),
  loyalty: phone("loyalty", "dark"),
  customers: desktop("customers", "light"),
  counter: phone("counter", "light"),
  cash: desktop("cash", "light"),
  revenue: desktop("revenue", "light"),
  settings: desktop("settings", "dark"),
  "app-home": phone("app-home", "dark"),
  "app-staff": phone("app-staff", "dark"),
} satisfies Record<ShotCopyId, Shot>;

export const SHOTS_DIR = "/landing/shots";

export const shotBaseName = (shot: Shot) =>
  `${shot.device}-${shot.id}-${shot.scheme}`;

type Size = { width: number; height: number };
type Library = { files: Set<string>; sizes: Map<string, Size> };

function sizeOf(value: unknown): Size | undefined {
  if (!value || typeof value !== "object") return undefined;
  const v = value as Record<string, unknown>;
  const width = Number(v.width ?? v.w);
  const height = Number(v.height ?? v.h);
  return width > 0 && height > 0 ? { width, height } : undefined;
}

const readLibrary = cache((): Library => {
  const dir = join(process.cwd(), "public", "landing", "shots");
  const library: Library = { files: new Set(), sizes: new Map() };
  try {
    for (const name of readdirSync(dir)) library.files.add(name);
  } catch {
    return library;
  }
  try {
    const raw: unknown = JSON.parse(
      readFileSync(join(dir, "manifest.json"), "utf8"),
    );
    const entries = Array.isArray(raw)
      ? raw.map((entry) => [
          String(
            (entry as Record<string, unknown>)?.file ??
              (entry as Record<string, unknown>)?.name ??
              "",
          ),
          entry,
        ])
      : raw && typeof raw === "object"
        ? Object.entries(raw)
        : [];
    for (const [file, entry] of entries) {
      const size = sizeOf(entry);
      const name = String(file).split("/").pop() ?? "";
      if (name && size) library.sizes.set(name, size);
    }
  } catch {}
  return library;
});

export type ResolvedShot = Shot & { src?: string };

/** Which file to show for a shot in this language, if the pipeline produced one. */
export function resolveShot(shot: Shot, locale: Locale): ResolvedShot {
  const { files, sizes } = readLibrary();
  const base = shotBaseName(shot);
  const candidates = [
    `${base}-${locale}.avif`,
    `${base}-${locale}.webp`,
    `${base}.avif`,
    `${base}.webp`,
  ];
  const file = candidates.find((name) => files.has(name));
  if (!file) return shot;
  return {
    ...shot,
    ...sizes.get(file),
    src: `${SHOTS_DIR}/${file}`,
  };
}
