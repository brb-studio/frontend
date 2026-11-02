import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import landingEn from "../../src/shared/i18n/landing-en";
import landingEs from "../../src/shared/i18n/landing-es";

/**
 * The marketing site answers on MARKETING_HOSTS (playwright.config: `localhost`), while the tenant
 * specs keep using 127.0.0.1 (an IP never matches, so it stays the default tenant).
 */
const MARKETING = "http://localhost:3200";
const TENANT = "http://127.0.0.1:3200";

for (const { lang, browserLocale, t } of [
  { lang: "es", browserLocale: "es-MX", t: landingEs },
  { lang: "en", browserLocale: "en-US", t: landingEn },
] as const) {
  test.describe(`marketing ${lang}`, () => {
    test.use({ locale: browserLocale });

    test("the root opens the landing in the visitor's language", async ({
      page,
    }) => {
      await page.goto(`${MARKETING}/`);
      await expect(page).toHaveURL(`${MARKETING}/${lang}`);
      await expect(page.locator("html")).toHaveAttribute("lang", lang);
      await expect(page.getByRole("heading", { level: 1 })).toContainText(
        t.hero.title[1] ?? "",
      );
      await expect(page).toHaveTitle(t.meta.title);
      await expect(
        page.locator(
          `link[rel="alternate"][hreflang="${lang === "es" ? "en" : "es"}"]`,
        ),
      ).toHaveCount(1);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        "href",
        new RegExp(`/${lang}$`),
      );
    });

    test("states the plans and links its own privacy notice", async ({
      page,
    }) => {
      await page.goto(`${MARKETING}/${lang}`);
      await expect(
        page.getByText(t.plans.items.sixAll.price, { exact: true }),
      ).toBeVisible();
      await expect(page.getByText(t.plans.payment)).toBeVisible();
      await page
        .getByRole("contentinfo")
        .getByRole("link", { name: t.footer.privacy })
        .click();
      await expect(page).toHaveURL(`${MARKETING}/${lang}/privacy`);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(
        t.privacy.title,
      );
    });

    test.describe("settled page", () => {
      // Audit the final state, not a frame of the fade-in (the motion CSS is off under reduce).
      test.use({ reducedMotion: "reduce" });

      test("has no detectable accessibility violations", async ({ page }) => {
        await page.goto(`${MARKETING}/${lang}`);
        const { violations } = await new AxeBuilder({ page }).analyze();
        expect(violations).toEqual([]);
      });
    });
  });
}

test("makes no third-party requests", async ({ page }) => {
  const foreign: string[] = [];
  page.on("request", (request) => {
    if (!request.url().startsWith(MARKETING)) foreign.push(request.url());
  });
  await page.goto(`${MARKETING}/es`, { waitUntil: "networkidle" });
  expect(foreign.filter((url) => !url.startsWith("data:"))).toEqual([]);
});

test("unknown marketing paths are the marketing 404, not a tenant page", async ({
  page,
}) => {
  const response = await page.goto(`${MARKETING}/es/home`);
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    landingEs.notFound.title,
  );
});

test("the marketing tree is unreachable on a tenant host", async ({
  request,
}) => {
  const response = await request.get(`${TENANT}/site/es`, {
    maxRedirects: 0,
  });
  expect(response.status()).toBe(404);
});

test("a tenant host still shows the barbershop, not the landing", async ({
  page,
}) => {
  await page.goto(`${TENANT}/es`);
  await expect(page.getByRole("heading", { level: 1 })).not.toContainText(
    landingEs.hero.title[1] ?? "",
  );
});

test("robots and sitemap are host-aware", async ({ request }) => {
  const robots = await (await request.get(`${MARKETING}/robots.txt`)).text();
  expect(robots).toContain("Sitemap:");
  const sitemap = await (await request.get(`${MARKETING}/sitemap.xml`)).text();
  expect(sitemap).toContain("/es/privacy");
  const tenantRobots = await (await request.get(`${TENANT}/robots.txt`)).text();
  expect(tenantRobots).toContain("Disallow: /es/admin");
});
