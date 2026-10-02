import type { TenantTheme } from "./theme";

export type Hours = { from: number; to: number; open: string; close: string };

export type Branch = {
  slug: string;
  name: string;
  address: string[];
  phone: string;
  phoneDisplay: string;
  mapsUrl: string;
  image: string;
  hours: Hours[];
  timeZone: string;
};

export type Tenant = {
  slug: string;
  name: string;
  currency: string;
  instagramUrl: string;
  authImage: string;
  coverImage: string;
  /** Omit to keep the default black/white + orange palette. */
  theme?: TenantTheme;
  branches: Branch[];
};

const sample: Tenant = {
  slug: "magicstudio",
  name: "MagicStudio",
  currency: "USD",
  instagramUrl: "https://www.instagram.com/",
  authImage: "/images/sample/beard.jpg",
  coverImage: "/images/sample/cover.jpg",
  branches: [
    {
      slug: "centro",
      name: "MagicStudio Centro",
      address: ["123 Sample Street", "Sample City"],
      phone: "+10000000000",
      phoneDisplay: "+1 000 000 0000",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=MagicStudio",
      image: "/images/sample/branch-centro.jpg",
      timeZone: "America/Mexico_City",
      hours: [
        { from: 1, to: 5, open: "10:00", close: "20:00" },
        { from: 6, to: 6, open: "10:00", close: "18:00" },
      ],
    },
    {
      slug: "norte",
      name: "MagicStudio Norte",
      address: ["456 Example Avenue", "Sample City"],
      phone: "+10000000001",
      phoneDisplay: "+1 000 000 0001",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=MagicStudio",
      image: "/images/sample/branch-norte.jpg",
      timeZone: "America/Mexico_City",
      hours: [{ from: 2, to: 6, open: "11:00", close: "21:00" }],
    },
  ],
};

export async function getTenant(): Promise<Tenant> {
  return sample;
}
