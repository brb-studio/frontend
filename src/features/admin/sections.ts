import type { SessionUser } from "@/features/auth/session";

export const SECTIONS = {
  home: "",
  myDay: "/my-day",
  agenda: "/agenda",
  services: "/services",
  barbers: "/barbers",
  branches: "/branches",
  timeOff: "/time-off",
  promotions: "/promotions",
  earnings: "/earnings",
  payments: "/payments",
  team: "/team",
  settings: "/settings",
  billing: "/billing",
  account: "/account",
} as const;
export type Section = keyof typeof SECTIONS;

export const GROUPS = {
  daily: ["home", "myDay", "agenda", "timeOff"],
  catalog: ["services", "barbers", "branches", "promotions"],
  business: ["payments", "earnings", "team", "settings", "billing"],
  personal: ["account"],
} as const satisfies Record<string, readonly Section[]>;
export type Group = keyof typeof GROUPS;

const BY_ROLE: Record<Exclude<SessionUser["role"], "customer">, Section[]> = {
  owner: [
    "home",
    "myDay",
    "agenda",
    "services",
    "barbers",
    "branches",
    "timeOff",
    "promotions",
    "payments",
    "earnings",
    "team",
    "settings",
    "billing",
    "account",
  ],
  admin: [
    "home",
    "myDay",
    "agenda",
    "services",
    "barbers",
    "branches",
    "timeOff",
    "promotions",
    "payments",
    "earnings",
    "team",
    "settings",
    "account",
  ],
  manager: [
    "home",
    "myDay",
    "agenda",
    "barbers",
    "branches",
    "timeOff",
    "account",
  ],
  barber: ["myDay", "agenda", "timeOff", "account"],
};

export const sectionsFor = (role: SessionUser["role"]) =>
  role === "customer" ? [] : BY_ROLE[role];
