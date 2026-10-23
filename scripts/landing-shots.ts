// Landing screenshots: logs in per role through the real login form on the Montecobre showcase tenant
// (backend/scripts/seed-showcase.ts, DB brb-showcase), captures each screen on phone and desktop in
// light and dark, and writes AVIF/WebP + manifest.json to public/landing/shots.
//
//   cd backend && bun run seed:showcase --now=<ISO>   # same instant as SHOTS_NOW below
//   cd frontend && bun scripts/landing-shots.ts --serve [--build] [--only=admin-cash,loyalty]
//
// --serve   start backend :4200 (MONGO_DB=brb-showcase) and `next start` :3400, stop them at the end
// --build   run `next build` first (refuses while another next build/dev is running)
// --only    comma-separated screen names (or full ids) to re-capture; others stay in the manifest
// --langs   es,en (default both); Spanish files are unsuffixed, English ones end in -en
// --now     ISO instant the browser clock is frozen at (default: today 13:00 America/Mexico_City)
// Password: env SHOTS_PASSWORD, else the DEMO_PASSWORD constant of backend/scripts/showcase/write.ts.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { type Browser, chromium, devices } from "@playwright/test";
import en from "../src/shared/i18n/en";
import es from "../src/shared/i18n/es";
import { ACCOUNTS, type Role, SHOTS } from "./landing-shots/catalog";
import {
  type Device,
  type Entry,
  encode,
  outDir,
  readManifest,
  type Scheme,
  writeManifest,
} from "./landing-shots/encode";
import {
  BACKEND,
  build,
  FRONTEND,
  nextProcesses,
  type Servers,
  start,
  TENANT_HOST,
} from "./landing-shots/servers";

const args = new Map(
  process.argv.slice(2).map((arg) => {
    const [key, ...rest] = arg.replace(/^--/, "").split("=");
    return [key, rest.join("=") || "true"] as const;
  }),
);
const TIME_ZONE = "America/Mexico_City";
const LANGS = {
  es: { dict: es, locale: "es-MX", suffix: "" },
  en: { dict: en, locale: "en-US", suffix: "-en" },
} as const;
type Lang = keyof typeof LANGS;
const langs = (args.get("langs") ?? "es,en")
  .split(",")
  .filter((l): l is Lang => l in LANGS);

/** Today at 13:00 in Mexico City (UTC−6 all year since 2022): mornings done, afternoon still ahead. */
function defaultNow() {
  const day = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(
    new Date(),
  );
  return `${day}T13:00:00-06:00`;
}
const NOW = new Date(args.get("now") ?? process.env.SHOTS_NOW ?? defaultNow());
if (Number.isNaN(NOW.getTime())) throw new Error("invalid --now");
/** The seed's shared local-only password, read from its source so it never lives in two places. */
function seedPassword() {
  try {
    const source = readFileSync(
      path.resolve(
        import.meta.dirname,
        "../../backend/scripts/showcase/write.ts",
      ),
      "utf8",
    );
    return source.match(/DEMO_PASSWORD\s*=\s*"([^"]+)"/)?.[1];
  } catch {
    return undefined;
  }
}
const PASSWORD =
  process.env.SHOTS_PASSWORD ?? args.get("password") ?? seedPassword();
const rawDir = path.join(tmpdir(), "brb-landing-shots", "raw");

const CONTEXT: Record<Device, Parameters<Browser["newContext"]>[0]> = {
  desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 },
  phone: (() => {
    const { defaultBrowserType: _, ...iphone } = devices["iPhone 15"];
    return {
      ...iphone,
      viewport: { width: 390, height: 844 },
      screen: { width: 390, height: 844 },
      deviceScaleFactor: 3,
    };
  })(),
};

// Freeze motion, hide carets/scrollbars and the Next dev indicator (if a dev server is ever used).
const CALM_CSS = `
*,*::before,*::after{animation-duration:0s!important;animation-delay:0s!important;transition:none!important;caret-color:transparent!important}
html{scrollbar-width:none!important}::-webkit-scrollbar{display:none!important}
nextjs-portal,[data-nextjs-toast],#__next-build-watcher{display:none!important}
`;

const FORBIDDEN = [
  /magic\s?studio/i,
  /\belite\b/i,
  /undefined|NaN|\[object Object\]/,
  /@gmail\.com|@hotmail\.com|@outlook\.com/i,
];

async function preflight() {
  const health = await fetch(`${BACKEND}/health`).catch(() => null);
  if (!health?.ok) throw new Error(`backend not reachable at ${BACKEND}`);
  const res = await fetch(`${BACKEND}/v1/public/tenant`, {
    headers: { "X-Tenant-Host": TENANT_HOST },
  });
  const tenant = res.ok ? ((await res.json()) as { name?: string }) : null;
  if (!tenant?.name?.includes("Montecobre")) {
    throw new Error(
      `tenant ${TENANT_HOST} not found on ${BACKEND}: run \`bun run seed:showcase\` in backend`,
    );
  }
  const login = await fetch(`${FRONTEND}/es/login`).catch(() => null);
  if (!login?.ok) throw new Error(`frontend not reachable at ${FRONTEND}`);
}

async function login(browser: Browser, role: Exclude<Role, "anon">) {
  if (!PASSWORD) throw new Error("set SHOTS_PASSWORD (the seed prints it)");
  const context = await browser.newContext({
    ...CONTEXT.desktop,
    locale: "es-MX",
    timezoneId: TIME_ZONE,
  });
  const page = await context.newPage();
  await page.goto(`${FRONTEND}/es/login`);
  await page.getByLabel(es.auth.email).fill(ACCOUNTS[role]);
  await page.getByLabel(es.auth.password, { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: es.auth.login }).click();
  const landing = role === "customer" ? "/es/home" : "/es/admin";
  await page.waitForURL((url) => url.pathname.startsWith(landing), {
    timeout: 30_000,
  });
  const state = await context.storageState();
  await context.close();
  return state;
}

/** Fonts, every image (lazy ones scrolled into view first), and no "Cargando…" left. */
async function settle(page: import("@playwright/test").Page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    const y = window.scrollY;
    for (const img of Array.from(document.images)) {
      if (img.loading === "lazy" && !img.complete) {
        img.scrollIntoView({ block: "center" });
        await new Promise((r) => setTimeout(r, 50));
      }
    }
    window.scrollTo(0, y);
    await Promise.all(
      Array.from(document.images)
        .filter((img) => !img.complete)
        .map(
          (img) =>
            new Promise((r) => {
              img.addEventListener("load", r, { once: true });
              img.addEventListener("error", r, { once: true });
              setTimeout(r, 8000);
            }),
        ),
    );
  });
  const loading = page.getByText(/^(Cargando|Loading)/);
  await loading
    .first()
    .waitFor({ state: "hidden", timeout: 20_000 })
    .catch(() => {});
  await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(300);
}

/** Problems visible in the viewport: error alerts, other brands, debug strings. */
async function audit(page: import("@playwright/test").Page) {
  const issues: string[] = [];
  const alerts = await page
    .locator('[role="alert"]')
    .evaluateAll((nodes) =>
      nodes
        .filter((n) => (n as HTMLElement).offsetParent && n.textContent?.trim())
        .map((n) => n.textContent?.trim() ?? ""),
    );
  for (const text of alerts) issues.push(`alert: ${text.slice(0, 80)}`);
  const text = await page.evaluate(() => document.body.innerText);
  for (const re of FORBIDDEN) {
    const m = text.match(re);
    if (m) issues.push(`text: ${m[0]}`);
  }
  if (/^\s*$/.test(text)) issues.push("empty page");
  if (page.url().includes("/login")) issues.push("bounced to login");
  return issues;
}

async function main() {
  let servers: Servers | undefined;
  const only = args.get("only")?.split(",").filter(Boolean);
  try {
    if (args.has("serve")) {
      if (args.has("build")) build();
      else if (nextProcesses().length) {
        console.warn(
          "! a next build/dev is running in this frontend; .next may change under us",
        );
      }
      servers = await start();
    }
    await preflight();
    mkdirSync(rawDir, { recursive: true });
    console.log(`› clock frozen at ${NOW.toISOString()} (${TIME_ZONE})`);

    const shots = SHOTS.filter(
      (s) =>
        !only ||
        only.some((o) => o === s.screen || o.includes(`-${s.screen}-`)),
    );
    const browser = await chromium.launch();
    const states = new Map<Role, Awaited<ReturnType<typeof login>>>();
    for (const role of new Set(shots.map((s) => s.role))) {
      if (role !== "anon") states.set(role, await login(browser, role));
    }

    const entries = new Map(readManifest().map((e) => [e.id, e]));
    const report: string[] = [];
    for (const lang of langs) {
      const { dict, locale, suffix } = LANGS[lang];
      for (const shot of shots) {
        for (const device of shot.devices) {
          for (const scheme of shot.schemes as Scheme[]) {
            const id = `${device}-${shot.screen}-${scheme}${suffix}`;
            const route = `/${lang}${shot.path}`;
            if (only && !only.some((o) => o === shot.screen || o === id))
              continue;
            const context = await browser.newContext({
              ...CONTEXT[device],
              colorScheme: scheme,
              locale,
              timezoneId: TIME_ZONE,
              reducedMotion: "reduce",
              storageState: states.get(shot.role),
            });
            await context.clock.setFixedTime(NOW);
            await context.addInitScript(
              (css) => {
                const add = () => {
                  const style = document.createElement("style");
                  style.textContent = css;
                  document.head.append(style);
                };
                if (document.head) add();
                else document.addEventListener("DOMContentLoaded", add);
              },
              CALM_CSS + (shot.css ?? ""),
            );
            const page = await context.newPage();
            try {
              await page.goto(`${FRONTEND}${route}`, { waitUntil: "load" });
              await settle(page);
              await shot.prepare?.(page, dict);
              await settle(page);
              const issues = await audit(page);
              for (const want of shot.expect?.(dict) ?? []) {
                if (!(await page.getByText(want).first().isVisible()))
                  issues.push(`missing: ${want}`);
              }
              const png = await page.screenshot({
                animations: "disabled",
                caret: "hide",
              });
              writeFileSync(path.join(rawDir, `${id}.png`), png);
              const entry: Entry = await encode(png, {
                id,
                device,
                screen: shot.screen,
                scheme,
                route,
                lang,
                role: shot.role,
                capturedFor: NOW.toISOString(),
              });
              entries.set(id, entry);
              const kb = Math.round(entry.bytes.avif2x / 1024);
              report.push(
                `${issues.length ? "!" : "✓"} ${id.padEnd(34)} ${String(kb).padStart(4)} KB avif@2x${issues.length ? `  ${issues.join(" | ")}` : ""}`,
              );
              console.log(report.at(-1));
            } catch (error) {
              report.push(
                `✗ ${id}: ${(error as Error).message.split("\n")[0]}`,
              );
              console.error(report.at(-1));
            } finally {
              await context.close();
            }
          }
        }
      }
    }
    await browser.close();
    writeManifest([...entries.values()]);
    const all = [...entries.values()];
    const total = all.reduce(
      (sum, e) =>
        sum + e.bytes.avif1x + e.bytes.avif2x + e.bytes.webp1x + e.bytes.webp2x,
      0,
    );
    console.log(
      `\n${all.length} shots in ${outDir} · ${(total / 1024 / 1024).toFixed(2)} MB on disk · raw PNGs in ${rawDir}`,
    );
    if (report.some((l) => l.startsWith("✗"))) process.exitCode = 1;
  } finally {
    servers?.stop();
  }
}

await main();
