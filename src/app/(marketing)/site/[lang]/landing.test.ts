import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("./landing.css", import.meta.url), "utf8");

function color(name: string) {
  const m = css.match(new RegExp(`--color-${name}:\\s*(#[0-9a-f]{6});`, "i"));
  if (!m?.[1])
    throw new Error(`--color-${name} not found as hex in landing.css`);
  return m[1];
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

/** Hard-coded surfaces in landing.css (receipt paper), checked like the tokens. */
const RECEIPT = "#fbf8f2";

const pairs: [fg: string, bg: string, min: number][] = [
  // Ink sections.
  ["ivory", "ink", 4.5],
  ["cream", "ink", 4.5],
  ["ash", "ink", 4.5],
  ["ember", "ink", 4.5],
  ["ash", "char", 4.5],
  ["ivory", "char", 4.5],
  ["ink", "ivory", 4.5], // primary button
  ["ink", "ember", 4.5], // selection
  ["fg", "ink", 4.5], // legal UI
  ["fg-muted", "ink", 4.5],
  // Ivory paper spreads.
  ["ink", "ivory", 4.5],
  ["umber", "ivory", 4.5],
  ["ember-deep", "ivory", 4.5],
  ["ivory", "ink", 4.5], // paper primary button
  // Brand specimen: display type (≥ 48px), large-text threshold.
  ["swatch-orange", "ink", 3],
  ["swatch-blue", "ink", 3],
  ["swatch-verdin", "ink", 3],
  // Showcase accent keeps the product rule: ink text on the accent.
  ["ink", "swatch-verdin", 4.5],
];

for (const [fg, bg, min] of pairs) {
  test(`${fg} on ${bg} reaches ${min}:1`, () => {
    expect(contrast(color(fg), color(bg))).toBeGreaterThanOrEqual(min);
  });
}

test("receipt text reaches AA on its paper", () => {
  expect(contrast(color("ink"), RECEIPT)).toBeGreaterThanOrEqual(4.5);
  expect(contrast(color("umber"), RECEIPT)).toBeGreaterThanOrEqual(4.5);
});

test("motion is progressive: scroll-driven animations sit behind @supports and reduced motion", () => {
  const motion = css.slice(
    css.indexOf("@media (prefers-reduced-motion: no-preference)"),
  );
  expect(motion.length).toBeLessThan(css.length);
  expect(css.indexOf("animation-timeline")).toBeGreaterThan(
    css.indexOf("@media (prefers-reduced-motion: no-preference)"),
  );
  expect(motion).toContain("@supports (animation-timeline: view())");
});
