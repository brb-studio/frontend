import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("./globals.css", import.meta.url), "utf8");

function token(name: string): [string, string] {
  const hex = "(#[0-9a-f]{6})";
  const m = css.match(
    new RegExp(
      `--color-${name}:\\s*(?:light-dark\\(${hex},\\s*${hex}\\)|${hex});`,
      "i",
    ),
  );
  if (!m) throw new Error(`--color-${name} not found as hex in globals.css`);
  return m[3] ? [m[3], m[3]] : [m[1] ?? "", m[2] ?? ""];
}

function luminance(hex: string) {
  const [r = 0, g = 0, b = 0] = [1, 3, 5].map((i) => {
    const c = Number.parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string) {
  const [x, y] = [luminance(a), luminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

const pairs: [fg: string, bg: string, min: number][] = [
  ["fg", "canvas", 4.5],
  ["fg", "surface", 4.5],
  ["fg-muted", "canvas", 4.5],
  ["fg-muted", "surface", 4.5],
  ["accent-text", "canvas", 4.5],
  ["accent-text", "surface", 4.5],
  ["accent-fg", "accent", 4.5],
  ["danger", "canvas", 4.5],
  ["danger", "surface", 4.5],
  ["line-strong", "canvas", 3],
  ["line-strong", "surface", 3],
];

for (const [fg, bg, min] of pairs) {
  test(`${fg} on ${bg} reaches ${min}:1 in light and dark`, () => {
    const [fgLight, fgDark] = token(fg);
    const [bgLight, bgDark] = token(bg);
    expect(contrast(fgLight, bgLight)).toBeGreaterThanOrEqual(min);
    expect(contrast(fgDark, bgDark)).toBeGreaterThanOrEqual(min);
  });
}
