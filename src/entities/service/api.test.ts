import { expect, test } from "bun:test";
import { toServices } from "./api";

test("services and packages become one bookable list, in the visitor's language", () => {
  const list = toServices(
    {
      currency: "USD",
      services: [
        {
          slug: "haircut",
          name: { es: "Corte de pelo", en: "Haircut" },
          durationMin: 45,
          priceMinor: 3500,
        },
      ],
      packages: [
        {
          slug: "cut-and-beard",
          name: { es: "Corte y barba" },
          durationMin: 75,
          priceMinor: 5000,
          listPriceMinor: 5500,
          services: [
            { slug: "haircut", name: { es: "Corte de pelo", en: "Haircut" } },
            {
              slug: "beard",
              name: { es: "Perfilado de barba", en: "Beard trim" },
            },
          ],
        },
      ],
    },
    "en",
  );
  expect(list.map((s) => [s.kind, s.slug, s.name])).toEqual([
    ["service", "haircut", "Haircut"],
    ["package", "cut-and-beard", "Corte y barba"],
  ]);
  expect(list[1]).toMatchObject({
    price: 5000,
    listPrice: 5500,
    includes: ["Haircut", "Beard trim"],
  });
});
