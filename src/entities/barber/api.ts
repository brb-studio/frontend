import type { Locale } from "@/shared/i18n/locales";

export type Barber = {
  slug: string;
  name: string;
  specialty: string;
  branch: string;
  busy: Partial<Record<number, [string, string][]>>;
};

const sample = [
  {
    slug: "mateo",
    name: "Mateo",
    specialty: { en: "Fades & tapers", es: "Degradados" },
    branch: "centro",
    busy: {
      1: [["10:00", "11:30"]],
      3: [
        ["12:00", "13:00"],
        ["16:00", "17:00"],
      ],
      5: [["14:00", "16:00"]],
    },
  },
  {
    slug: "lucas",
    name: "Lucas",
    specialty: { en: "Classic cuts", es: "Cortes clásicos" },
    branch: "centro",
    busy: {
      2: [["11:00", "12:30"]],
      4: [["10:00", "13:00"]],
      6: [["12:00", "14:00"]],
    },
  },
  {
    slug: "andres",
    name: "Andrés",
    specialty: { en: "Beard design", es: "Diseño de barba" },
    branch: "norte",
    busy: {
      3: [["11:00", "12:00"]],
      5: [["18:00", "19:30"]],
    },
  },
] satisfies (Omit<Barber, "specialty"> & {
  specialty: Record<Locale, string>;
})[];

export async function getBarbers(locale: Locale): Promise<Barber[]> {
  return sample.map(({ specialty, ...rest }) => ({
    ...rest,
    specialty: specialty[locale],
  }));
}
