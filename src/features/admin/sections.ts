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
  products: "/products",
  pickups: "/pickups",
  earnings: "/earnings",
  payments: "/payments",
  team: "/team",
  settings: "/settings",
  billing: "/billing",
  account: "/account",
} as const;
export type Section = keyof typeof SECTIONS;

export const GROUPS = {
  daily: ["home", "myDay", "agenda", "pickups", "timeOff"],
  catalog: ["services", "products", "barbers", "branches", "promotions"],
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
    "products",
    "pickups",
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
    "products",
    "pickups",
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
    "pickups",
    "barbers",
    "branches",
    "timeOff",
    "account",
  ],
  barber: ["myDay", "agenda", "pickups", "timeOff", "account"],
};

/** Sections that only exist while the barbershop has the products module on. */
const PRODUCT_SECTIONS: Section[] = ["products", "pickups"];

export const sectionsFor = (
  role: SessionUser["role"],
  productsEnabled: boolean,
) =>
  role === "customer"
    ? []
    : BY_ROLE[role].filter(
        (section) => productsEnabled || !PRODUCT_SECTIONS.includes(section),
      );
