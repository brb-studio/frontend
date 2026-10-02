import { expect, test } from "@playwright/test";
import { getServices } from "../../src/entities/service/api";
import { getTenant } from "../../src/entities/tenant/api";
import en from "../../src/shared/i18n/en";
import es from "../../src/shared/i18n/es";
import { formatMoney } from "../../src/shared/i18n/money";

for (const { lang, dict } of [
  { lang: "es", dict: es },
  { lang: "en", dict: en },
] as const) {
  test(`browse from home to a service detail (${lang})`, async ({ page }) => {
    const [tenant, services] = await Promise.all([
      getTenant(),
      getServices(lang),
    ]);
    const [service] = services;
    if (!service) throw new Error("sample data has no services");

    await page.goto(`/${lang}/home`);
    await page.getByRole("link", { name: dict.home.seeAll }).click();
    await expect(page).toHaveURL(`/${lang}/services`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      dict.services.title,
    );
    await expect(page.getByRole("main").getByRole("listitem")).toHaveCount(
      services.length,
    );

    await page
      .getByRole("main")
      .getByRole("link", { name: service.name, exact: true })
      .click();
    await expect(page).toHaveURL(`/${lang}/services/${service.slug}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      service.name,
    );
    await expect(
      page
        .getByRole("definition")
        .filter({ hasText: formatMoney(service.price, tenant.currency, lang) }),
    ).toBeVisible();
  });

  test(`an unknown service is a localized 404 (${lang})`, async ({ page }) => {
    const response = await page.goto(`/${lang}/services/does-not-exist`);
    expect(response?.status()).toBe(404);
    await expect(page.locator("html")).toHaveAttribute("lang", lang);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      dict.notFound.title,
    );
  });
}

test("booking: pick a barber, a date and a free time, then confirm (demo)", async ({
  page,
}) => {
  const t = es.booking;
  await page.goto("/es/services/haircut");

  await page.locator("label", { hasText: "Lucas" }).click();
  const times = page.getByRole("group", { name: t.time });
  await times.locator("label").first().click();
  await expect(times.getByRole("radio").first()).toBeChecked();

  await page.getByRole("button", { name: t.submit }).click();
  await expect(
    page.getByRole("heading", { name: t.confirmedTitle }),
  ).toBeVisible();
});
