# MagicStudio

Premium barbershop PWA. Next.js (App Router) · React · TypeScript · Tailwind · Bun.

## Requirements

- Node 24 LTS (`.node-version`; fnm/nvm pick it up). Next.js runs on Node.
- Bun 1.4.2 (`packageManager` in `package.json`) for installs, scripts and tests.

## Scripts

| Command | What it does |
|---|---|
| `bun install` | Install from `bun.lock` |
| `bun run dev` | Dev server |
| `bun run build` / `bun run start` | Production build (includes type-check) / serve it |
| `bun run lint` | Biome lint + format check (CI mode, no writes) |
| `bun run format` | Biome fix + format |
| `bun run typecheck` | Standalone type-check |
| `bun run test` | Unit/component tests (`bun test`, files in `src/`) |
| `bun run test:e2e` | Production build + Playwright (Chromium, iPhone WebKit) with axe a11y checks |
| `bun run audit` | Fails on high/critical advisories |

Use `bun run <script>`, not `bunx`: scripts only run installed binaries; `bunx` fetches from the registry if missing.

## Architecture

`src/app → widgets → features → entities → shared`, imports flow downward only (enforced by Biome `noRestrictedImports`). No `utils/`, `helpers/`, `common/`.

## Screens

- `/` → `/{lang}` (entry): welcome screen, "Get started" opens a sheet with sign in / create account / guest. `/{lang}/login`, `/{lang}/register`: frosted sheet over the photo. All in the `(auth)` route group: full-bleed photo on phones, split screen on desktop.
- App, `(app)` route group: `/home`, `/services`, `/services/[slug]`, `/branches`, `/account`. Top bar + nav on desktop; floating black tab bar on phones; one centered column. Mobile-first.
- Look: white canvas + transparent cards + ink (light), black + glass (dark), one vivid orange accent. Orange fills use ink text (white on it fails AA). Tokens and contrast tests: `src/app/globals.css`, `globals.test.ts`.
- **Auth is UI + real validation only** (no backend yet). Login/register validate with Zod on the server; with `AUTH_DEMO=true` a valid form enters the app (no session, credentials not checked). Without it the form answers "not available yet", so production can't ship a login that accepts anything. `bun run dev`: put `AUTH_DEMO=true` in `.env.local` to try it, or use "Explore without an account".
- **Booking** (`/services/[slug]`, rendered per request): barber → date → free time. Free times come from the branch hours, the barber's bookings and the service duration, in the branch timezone (`src/features/booking/slots.ts`); the server re-checks the slot on submit. Nothing is stored yet: with `BOOKING_DEMO=true` a free slot shows the confirmation, without it the form says online booking isn't available.
- Sample photos: `public/images/sample` (Unsplash License, sources in `CREDITS.md`). Barbers stay as monograms until each tenant uploads real staff portraits.

## Tenants (template)

The site is a template for many barbershop companies (tenants), each with one or more branches.

- Today: one SAMPLE default tenant in `src/entities/tenant/api.ts` (`getTenant()`), plus sample services/barbers. Brand name, footer, metadata and the branch list all read from it.
- Later (with the backend): `src/proxy.ts` resolves the tenant from the request host (subdomain or custom domain) and rewrites to an internal `app/[tenant]/[lang]` route; `getTenant()` fetches that tenant. Components keep calling the same functions.
- The backend owns tenant isolation: the tenant comes from the host mapping, never from client input.

## Languages

- English and Spanish under `/en` and `/es`. `src/proxy.ts` redirects unprefixed URLs using the browser's `Accept-Language` (fallback: `es`, set in `src/shared/i18n/locales.ts`).
- Strings live in `src/shared/i18n/en.ts` and `es.ts`; TypeScript fails the build if `es` misses a key from `en`.
- Server Components call `getDictionary()` / `getLocale()` (read from the route, no prop drilling). Client Components receive strings as props.

## Design system

- Look: warm neutrals (charcoal, ivory, cream), photography first, glass, editorial Fraunces (italic accents) + Geist. Copper "ember" is an accent only (glows, hairlines, active states, prices), never a large fill; primary buttons are ivory on dark / ink on light.
- Tokens live in `src/app/globals.css` (`@theme`). Colors use `light-dark()`, so the theme follows the OS with no JS. Text/background pairs are WCAG-AA checked by `src/app/globals.test.ts`.
- Utilities: `glass` (with solid fallbacks), `bg-ember`, `text-ember` (large type only), `hairline-ember`, `shadow-glow`, `shadow-soft`, `animate-rise` (stagger with `[animation-delay:…]`), `animate-drift`. All motion stops under `prefers-reduced-motion`.
- Components in `src/shared/ui`: `Button` / `ButtonLink` / `buttonClass`, `Field` (icon + action slots), `PasswordField`, `Select` (styled native), `LanguageMenu` (Popover API), `BrandMark`.
- `/styleguide` renders everything in dev (`bun run dev`); it is a 404 in production. To preview the other theme: DevTools → Rendering → emulate `prefers-color-scheme`.

## Dependency policy

A small dependency tree is a security feature.

- **Before adding a package**, answer: why do we need it? Can Next.js, React, TypeScript, CSS, the browser, or an installed package do it? How many transitive deps? Known advisories? Maintained? Works with Bun? If unclear, don't add it.
- **Pins**: exact versions only (`bunfig.toml` → `exact = true`). `bun.lock` is committed; CI installs with `--frozen-lockfile`.
- **Release age**: versions younger than 3 days are refused (`minimumReleaseAge`). Emergency security patch: one-off `bun add -E pkg@x.y.z --minimum-release-age=0` in a reviewed PR; never loosen the config.
- **Install scripts**: `trustedDependencies: []` means no dependency lifecycle scripts run. If something breaks, `bun pm untrusted`, review, then `bun pm trust <pkg>` in a PR.
- **Vulnerabilities**: no known critical; high blocks merge (`bun run audit` in CI). Maintained = release within 12 months, not archived/deprecated.
- **Updates**: `bun outdated` weekly; bump deliberately (`bun add -E pkg@x.y.z`), one PR per package or group, with changelog reviewed.

### When an advisory lands

1. `bun why <pkg>`: direct or transitive?
2. Patched version available → bump (direct) or add an `overrides` entry (transitive, removed once the parent ships the fix).
3. `bun run lint && bun run test && bun run build`, review breaking changes, PR, deploy.
4. No patch → mitigate via config, document the accepted risk, or remove the package.

Deadlines: critical 48 h, high 7 days, medium next routine update.
