import { expect, test } from "@playwright/test";
import en from "../../src/shared/i18n/en";
import es from "../../src/shared/i18n/es";
import { pick } from "../../src/shared/i18n/localized";
import { formatMoney } from "../../src/shared/i18n/money";
import { CUSTOMER, getCatalog } from "./data";

for (const { lang, dict } of [
  { lang: "es", dict: es },
  { lang: "en", dict: en },
] as const) {
  test(`browse from home to a service detail (${lang})`, async ({ page }) => {
    const catalog = await getCatalog();
    const [service] = catalog.services;
    if (!service) throw new Error("seed has no services");
    const name = pick(service.name, lang);

    await page.goto(`/${lang}/home`);
    await page.getByRole("link", { name: dict.home.seeAll }).click();
    await expect(page).toHaveURL(`/${lang}/services`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      dict.services.title,
    );
    await expect(
      page.getByRole("main").getByRole("heading", { level: 3 }),
    ).toHaveCount(catalog.services.length + catalog.packages.length);

    await page
      .getByRole("main")
      .getByRole("link", { name, exact: true })
      .click();
    await expect(page).toHaveURL(`/${lang}/services/${service.slug}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(name);
    await expect(
      page.getByRole("definition").filter({
        hasText: formatMoney(service.priceMinor, catalog.currency, lang),
      }),
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

test("a guest sees the service but must sign up to book", async ({ page }) => {
  await page.goto("/es/services/haircut");
  await expect(
    page.getByRole("heading", { name: es.booking.signInTitle }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: es.booking.submit }),
  ).toHaveCount(0);
  await page.getByRole("link", { name: es.auth.register }).click();
  await expect(page).toHaveURL("/es/register");
});

test("booking: pick a barber, a date and a free time, then confirm", async ({
  page,
  browserName,
}) => {
  test.skip(
    browserName !== "chromium",
    "the production build sets a Secure session cookie, which WebKit drops over plain http",
  );
  const t = es.booking;
  const auth = es.auth;
  await page.goto("/es/login");
  await page.getByLabel(auth.email).fill(CUSTOMER.email);
  await page.getByLabel(auth.password, { exact: true }).fill(CUSTOMER.password);
  await page.getByRole("button", { name: auth.login }).click();
  await expect(page).toHaveURL("/es/home");

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
