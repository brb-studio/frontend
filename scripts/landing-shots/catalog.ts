// Which screens the landing uses: one row per screen, captured per device × color scheme.
// Screen names match the landing catalog (src/widgets/landing/shots.ts, `SHOTS` keys) and the files
// are `<device>-<screen>-<scheme>[-en].{avif,webp}` (2x, what the landing loads) plus `…@1x.{avif,webp}`.
// Paths have no language: the runner prefixes /es or /en and passes that language's dictionary.
import type { Page } from "@playwright/test";
import type { Dictionary } from "../../src/shared/i18n/en";
import type { Device, Scheme } from "./encode";

type T = Dictionary;

export const DOMAIN = "montecobre.test";
export const ACCOUNTS = {
  owner: `owner@${DOMAIN}`, // Ricardo Montes, also barber Tue–Thu
  admin: `admin@${DOMAIN}`, // Daniela Ferrer, no barber profile → "¿También atiendes clientes?"
  manager: `polanco@${DOMAIN}`, // Mariana Robles, Polanco only
  barber: `emilio@${DOMAIN}`, // Emilio Varela, Polanco, works Mon–Sat
  customer: `cliente@${DOMAIN}`, // Sebastián Herrera, loyalty 4/6
} as const;
export type Role = keyof typeof ACCOUNTS | "anon";

export type Shot = {
  screen: string;
  role: Role;
  path: string;
  devices: Device[];
  schemes?: Scheme[];
  /** Interactions after load (open a sheet, pick a period, scroll to a section). */
  prepare?: (page: Page, t: T) => Promise<void>;
  /** Visible texts that must be on screen, or the shot is flagged. */
  expect?: (t: T) => string[];
  /** Extra CSS for this shot only (hide a section that would read as an empty state). */
  css?: string;
};

const BOTH: Scheme[] = ["light", "dark"];

/** Scroll so `text` sits `offset` px under the top of the viewport. */
async function scrollToText(page: Page, text: string, offset = 96) {
  const el = page.getByText(text, { exact: false }).first();
  await el.waitFor({ state: "visible", timeout: 15_000 });
  await el.evaluate((node, off) => {
    const top = node.getBoundingClientRect().top + window.scrollY - off;
    window.scrollTo(0, Math.max(0, top));
  }, offset);
}

/** Checks the `index`-th enabled radio of a group (the inputs are visually hidden). */
async function pick(page: Page, name: string, index = 0, value?: string) {
  if (value) {
    const exact = page.locator(`input[name="${name}"][value="${value}"]`);
    if (await exact.count()) return exact.first().check({ force: true });
  }
  const inputs = page.locator(`input[name="${name}"]:not([disabled])`);
  await inputs.first().waitFor({ state: "attached", timeout: 20_000 });
  const count = await inputs.count();
  await inputs.nth(Math.min(index, count - 1)).check({ force: true });
}

/** The booking form, step by step (branch → barber → date → time → summary). */
const BOOKING = "/services/corte-signature";
const step = {
  branch: (page: Page, t: T) => scrollToText(page, t.booking.title, 72),
  barber: async (page: Page, t: T) => {
    await pick(page, "branch", 0, "polanco");
    await scrollToLegend(page, t.booking.barber);
  },
  date: async (page: Page, t: T) => {
    await step.barber(page, t);
    await pick(page, "barber", 1, "emilio");
    await scrollToLegend(page, t.booking.date);
  },
  time: async (page: Page, t: T) => {
    await step.date(page, t);
    await pick(page, "date", 1);
    await scrollToLegend(page, t.booking.time);
  },
  confirm: async (page: Page, t: T) => {
    await step.time(page, t);
    await pick(page, "time", 3);
    await page.waitForTimeout(500);
    const submit = page.getByRole("button", {
      name: t.booking.submit,
      exact: true,
    });
    await submit.evaluate((node) => {
      const bottom = node.getBoundingClientRect().bottom + window.scrollY;
      window.scrollTo(0, Math.max(0, bottom - window.innerHeight + 140));
    });
  },
};

/** Scroll a fieldset legend to the top of the phone screen. */
async function scrollToLegend(page: Page, text: string) {
  const legend = page.locator("legend", { hasText: text }).first();
  await legend.waitFor({ state: "visible", timeout: 20_000 });
  await legend.evaluate((node) => {
    const top = node.getBoundingClientRect().top + window.scrollY - 88;
    window.scrollTo(0, Math.max(0, top));
  });
}

/** The floating tab bar on phones (it would sit over the "Book" button). */
const HIDE_TAB_BAR = "nav.fixed.inset-x-4{display:none!important}";

/** Scroll the agenda to the busiest run of five cards with nothing cancelled or missed. */
async function busyStretch(page: Page, t: T) {
  await page.locator("ul.grid > li").first().waitFor({ timeout: 20_000 });
  await page.evaluate(
    (skip) => {
      // Appointment rows start with their time ("9:00 · …"); the sidebar lists don't.
      const items = Array.from(
        document.querySelectorAll("ul.grid > li"),
      ).filter((li) => /^\s*\d{1,2}:\d{2}/.test(li.textContent ?? ""));
      const bad = items.map((li) =>
        skip.some((word) => li.textContent?.includes(word)),
      );
      let best = 0;
      let bestScore = -1;
      for (let i = 0; i < items.length; i++) {
        if (bad[i]) continue;
        const score = bad.slice(i, i + 5).filter((b) => !b).length;
        if (score > bestScore) {
          best = i;
          bestScore = score;
        }
        if (score === 5) break;
      }
      const top = items[best]?.getBoundingClientRect().top ?? 0;
      window.scrollTo(0, Math.max(0, top + window.scrollY - 32));
    },
    [t.account.status.cancelled, t.account.status.no_show],
  );
}

const LIST: Shot[] = [
  // ── Phone: the customer side ────────────────────────────────────────────
  { screen: "welcome", role: "anon", path: "", devices: ["phone"] },
  ...(["branch", "barber", "date", "time", "confirm"] as const).map(
    (name): Shot => ({
      screen: `booking-${name}`,
      role: "customer",
      path: BOOKING,
      devices: ["phone"],
      prepare: step[name],
      ...(name === "date" && { css: HIDE_TAB_BAR }),
    }),
  ),
  {
    screen: "loyalty",
    role: "customer",
    path: "/account",
    devices: ["phone"],
    prepare: (page, t) => scrollToText(page, t.account.loyalty.title, 140),
    expect: (t) => [t.account.loyalty.title],
  },
  // ── Phone: the staff side ───────────────────────────────────────────────
  {
    screen: "my-day",
    role: "barber",
    path: "/admin/my-day",
    devices: ["phone"],
  },
  {
    screen: "become-barber",
    role: "admin",
    path: "/admin/my-day",
    devices: ["phone"],
    // Daniela has no notifications: keep the screen on the card, not on an empty list.
    css: 'section[aria-labelledby="notifications-title"]{display:none!important}',
  },
  {
    // Agenda on the manager's phone, scrolled to a cut that has started: Efectivo · Tarjeta · Transferencia.
    screen: "counter",
    role: "manager",
    path: "/admin/agenda",
    devices: ["phone"],
    prepare: async (page, t) => {
      const cash = page
        .getByRole("button", { name: t.admin.methods.cash, exact: true })
        .first();
      await cash.waitFor({ state: "visible", timeout: 20_000 });
      await cash.evaluate((node) => {
        const top = node.getBoundingClientRect().top + window.scrollY;
        window.scrollTo(0, Math.max(0, top - window.innerHeight * 0.45));
      });
    },
    expect: (t) => [t.admin.methods.transfer],
  },
  // ── Desktop: the owner's panel ──────────────────────────────────────────
  {
    screen: "agenda",
    role: "owner",
    path: "/admin/agenda",
    devices: ["desktop"],
    prepare: busyStretch,
  },
  {
    screen: "branches",
    role: "owner",
    path: "/admin/branches",
    devices: ["desktop"],
  },
  {
    screen: "customers",
    role: "owner",
    path: "/admin/customers",
    devices: ["desktop"],
  },
  {
    screen: "cash",
    role: "owner",
    path: "/admin/cash",
    devices: ["desktop"],
  },
  {
    screen: "revenue",
    role: "owner",
    path: "/admin/revenue",
    devices: ["desktop"],
    prepare: async (page, t) => {
      await page
        .getByText(t.admin.revenue.chart, { exact: true })
        .waitFor({ state: "visible", timeout: 20_000 });
    },
    expect: (t) => [t.admin.revenue.chart],
  },
  {
    screen: "settings",
    role: "owner",
    path: "/admin/settings",
    devices: ["desktop"],
  },
];

export const SHOTS: Shot[] = LIST.map((shot) => ({ schemes: BOTH, ...shot }));
