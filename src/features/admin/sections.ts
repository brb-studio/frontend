import type { SessionUser } from "@/features/auth/session";

/** Panel sections and their paths under /{lang}/admin. Safe for client components. */
export const SECTIONS = {
  home: "",
  agenda: "/agenda",
  services: "/services",
  barbers: "/barbers",
  branches: "/branches",
  timeOff: "/time-off",
  promotions: "/promotions",
  team: "/team",
  settings: "/settings",
  billing: "/billing",
  account: "/account",
} as const;
export type Section = keyof typeof SECTIONS;

/** How the menu groups the sections (each role only sees its own). */
export const GROUPS = {
  daily: ["home", "agenda", "timeOff"],
  catalog: ["services", "barbers", "branches", "promotions"],
  business: ["team", "settings", "billing"],
  personal: ["account"],
} as const satisfies Record<string, readonly Section[]>;
export type Group = keyof typeof GROUPS;

const BY_ROLE: Record<Exclude<SessionUser["role"], "customer">, Section[]> = {
  owner: [
    "home",
    "agenda",
    "services",
    "barbers",
    "branches",
    "timeOff",
    "promotions",
    "team",
    "settings",
    "billing",
    "account",
  ],
  admin: [
    "home",
    "agenda",
    "services",
    "barbers",
    "branches",
    "timeOff",
    "promotions",
    "team",
    "settings",
    "account",
  ],
  manager: ["home", "agenda", "barbers", "branches", "timeOff", "account"],
  barber: ["home", "agenda", "timeOff", "account"],
};

/** The panel sections a role sees. The API enforces the same limits on every request. */
export const sectionsFor = (role: SessionUser["role"]) =>
  role === "customer" ? [] : BY_ROLE[role];
