/** Tokens a tenant may override. Mirrors the `--color-*` names in globals.css. */
export const themeTokens = [
  "canvas",
  "surface",
  "card",
  "fg",
  "fg-muted",
  "line",
  "line-strong",
  "glass",
  "sheet",
  "accent",
  "accent-fg",
  "accent-text",
] as const;

export type ThemeToken = (typeof themeTokens)[number];

/** A string applies to both schemes; a pair swaps with light/dark mode. */
export type TenantTheme = Partial<
  Record<ThemeToken, string | { light: string; dark: string }>
>;

// ponytail: allowlist instead of a CSS parser — values land inside a <style> tag.
const COLOR =
  /^(#[0-9a-f]{3,8}|[a-z]+|(rgb|rgba|hsl|hsla|oklch|oklab|color-mix)\([^;{}<>"']*\))$/i;

const pick = (v: string | { light: string; dark: string }, dark: boolean) =>
  typeof v === "string" ? v : dark ? v.dark : v.light;

const valid = (v: string | { light: string; dark: string }) =>
  COLOR.test(pick(v, false)) && COLOR.test(pick(v, true));

/** `:root` overrides for a tenant's palette. Empty string when there is nothing to override. */
export function themeCss(theme?: TenantTheme): string {
  const decls = Object.entries(theme ?? {})
    .filter(
      ([token, value]) =>
        themeTokens.includes(token as ThemeToken) && valid(value),
    )
    .map(([token, value]) =>
      typeof value === "string"
        ? `--color-${token}:${value}`
        : `--color-${token}:light-dark(${value.light},${value.dark})`,
    );
  return decls.length ? `:root{${decls.join(";")}}` : "";
}

/** Light/dark browser chrome colors, falling back to the defaults in globals.css. */
export function themeColors(theme?: TenantTheme) {
  const canvas = theme?.canvas;
  return {
    light: canvas && valid(canvas) ? pick(canvas, false) : "#ffffff",
    dark: canvas && valid(canvas) ? pick(canvas, true) : "#050505",
  };
}
