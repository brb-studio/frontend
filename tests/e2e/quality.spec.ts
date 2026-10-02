import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const pages = [
  "/es",
  "/es/login",
  "/es/register",
  "/es/home",
  "/es/services",
  "/es/services/haircut",
  "/es/branches",
  "/es/account",
  "/en/home",
];

for (const colorScheme of ["light", "dark"] as const) {
  test(`every screen has no WCAG A/AA violations (${colorScheme})`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });
    for (const path of pages) {
      await page.goto(path);
      const { violations } = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();
      expect(violations, path).toEqual([]);
    }
  });
}

test("no screen is wider than a 320px phone", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  for (const path of pages) {
    await page.goto(path);
    const [scroll, client] = await page.evaluate(() => [
      document.documentElement.scrollWidth,
      document.documentElement.clientWidth,
    ]);
    expect(scroll, path).toBeLessThanOrEqual(client);
  }
});

test("security headers are sent", async ({ request }) => {
  const headers = (await request.get("/es/login")).headers();
  expect(headers["content-security-policy"]).toContain(
    "frame-ancestors 'none'",
  );
  expect(headers["strict-transport-security"]).toContain("max-age=");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["x-powered-by"]).toBeUndefined();
});

test("unknown pages get a localized 404", async ({ page }) => {
  const response = await page.goto("/es/does-not-exist");
  expect(response?.status()).toBe(404);
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
});

for (const path of ["/es", "/es/login", "/es/home"]) {
  test(`${path} has no layout shift (CLS < 0.1)`, async ({
    page,
    browserName,
  }) => {
    test.skip(
      browserName !== "chromium",
      "Layout Instability API is Chromium-only",
    );
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    const cls = await page.evaluate(
      () =>
        new Promise<number>((resolve) => {
          let total = 0;
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries() as (PerformanceEntry & {
              value: number;
              hadRecentInput: boolean;
            })[]) {
              if (!entry.hadRecentInput) total += entry.value;
            }
          }).observe({ type: "layout-shift", buffered: true });
          setTimeout(() => resolve(total), 500);
        }),
    );
    expect(cls).toBeLessThan(0.1);
  });
}
