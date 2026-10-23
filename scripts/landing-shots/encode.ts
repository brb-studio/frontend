// PNG capture -> AVIF + WebP at 1x/2x widths, plus a tiny blur placeholder, for public/landing/shots.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

export type Device = "desktop" | "phone";
export type Scheme = "light" | "dark";

/** CSS width of each device; 2x is what retina screens fetch, 1x the rest. */
export const CSS_WIDTH: Record<Device, number> = { desktop: 1440, phone: 390 };

export type Entry = {
  /** The 2x AVIF, which the landing loads (`resolveShot` keys sizes by file name). */
  file: string;
  id: string;
  device: Device;
  screen: string;
  scheme: Scheme;
  /** Pixel size of the 2x files (aspect ratio for next/image); 1x is half. */
  width: number;
  height: number;
  blurDataURL: string;
  files: {
    avif: { "1x": string; "2x": string };
    webp: { "1x": string; "2x": string };
  };
  bytes: { avif2x: number; webp2x: number; avif1x: number; webp1x: number };
  route: string;
  lang: string;
  role: string;
  capturedFor: string;
};

export const outDir = path.resolve(
  import.meta.dirname,
  "../../public/landing/shots",
);
const publicBase = "/landing/shots";

export async function encode(
  png: Buffer,
  meta: Omit<
    Entry,
    "file" | "width" | "height" | "blurDataURL" | "files" | "bytes"
  >,
): Promise<Entry> {
  mkdirSync(outDir, { recursive: true });
  const { width: rawW = 0, height: rawH = 0 } = await sharp(png).metadata();
  const cssW = CSS_WIDTH[meta.device];
  const cssH = Math.round((rawH * cssW) / rawW);
  const files = {
    avif: { "1x": "", "2x": "" },
    webp: { "1x": "", "2x": "" },
  } as Entry["files"];
  const bytes = { avif2x: 0, webp2x: 0, avif1x: 0, webp1x: 0 };
  for (const density of ["1x", "2x"] as const) {
    const w = density === "1x" ? cssW : cssW * 2;
    const suffix = density === "1x" ? "@1x" : "";
    const resized = sharp(png).resize({ width: w, kernel: "lanczos3" });
    const avif = await resized
      .clone()
      .avif({ quality: 55, effort: 6, chromaSubsampling: "4:4:4" })
      .toBuffer();
    const webp = await resized
      .clone()
      .webp({ quality: 80, effort: 6, smartSubsample: true })
      .toBuffer();
    const avifName = `${meta.id}${suffix}.avif`;
    const webpName = `${meta.id}${suffix}.webp`;
    writeFileSync(path.join(outDir, avifName), avif);
    writeFileSync(path.join(outDir, webpName), webp);
    files.avif[density] = `${publicBase}/${avifName}`;
    files.webp[density] = `${publicBase}/${webpName}`;
    bytes[`avif${density}`] = avif.length;
    bytes[`webp${density}`] = webp.length;
  }
  const blur = await sharp(png)
    .resize({ width: 16 })
    .webp({ quality: 40 })
    .toBuffer();
  return {
    file: `${meta.id}.avif`,
    ...meta,
    width: cssW * 2,
    height: cssH * 2,
    blurDataURL: `data:image/webp;base64,${blur.toString("base64")}`,
    files,
    bytes,
  };
}

const manifestPath = () => path.join(outDir, "manifest.json");

export function readManifest(): Entry[] {
  try {
    const json = JSON.parse(readFileSync(manifestPath(), "utf8"));
    return Array.isArray(json) ? json : [];
  } catch {
    return [];
  }
}

/** A plain array (what src/widgets/landing/shots.ts reads): one entry per screen × device × scheme. */
export function writeManifest(entries: Entry[]) {
  const shots = [...entries].sort((a, b) => a.id.localeCompare(b.id));
  writeFileSync(
    manifestPath(),
    `${JSON.stringify(shots, null, 2)}
`,
  );
}
