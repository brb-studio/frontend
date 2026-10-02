import type { Locale } from "@/shared/i18n/locales";

export type Service = {
  slug: string;
  name: string;
  description: string;
  durationMin: number;
  image: string;
  price: number;
};

const sample = [
  {
    slug: "haircut",
    image: "/images/sample/haircut.jpg",
    durationMin: 45,
    price: 3500,
    name: { en: "Haircut", es: "Corte de pelo" },
    description: {
      en: "Consultation, cut and styling.",
      es: "Asesoría, corte y peinado.",
    },
  },
  {
    slug: "beard",
    image: "/images/sample/beard.jpg",
    durationMin: 30,
    price: 2000,
    name: { en: "Beard trim", es: "Perfilado de barba" },
    description: {
      en: "Shape, line-up and hot towel.",
      es: "Forma, perfilado y toalla caliente.",
    },
  },
  {
    slug: "cut-and-beard",
    image: "/images/sample/cut-and-beard.jpg",
    durationMin: 75,
    price: 5000,
    name: { en: "Cut & beard", es: "Corte y barba" },
    description: { en: "The full service.", es: "El servicio completo." },
  },
  {
    slug: "shave",
    image: "/images/sample/shave.jpg",
    durationMin: 40,
    price: 3000,
    name: { en: "Hot towel shave", es: "Afeitado clásico" },
    description: {
      en: "Straight razor, hot towel and balm.",
      es: "Navaja, toalla caliente y bálsamo.",
    },
  },
];

export async function getServices(locale: Locale): Promise<Service[]> {
  return sample.map(({ name, description, ...rest }) => ({
    ...rest,
    name: name[locale],
    description: description[locale],
  }));
}

export async function getService(slug: string, locale: Locale) {
  return (await getServices(locale)).find((service) => service.slug === slug);
}
