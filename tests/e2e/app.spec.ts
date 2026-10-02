import { expect, test } from "@playwright/test";
import { getTenant } from "../../src/entities/tenant/api";
import es from "../../src/shared/i18n/es";

test("main navigation reaches every section and marks the current one", async ({
  page,
}) => {
  await page.goto("/es/home");
  const nav = page.getByRole("navigation", { name: es.nav.label });
  for (const key of ["services", "branches", "account", "home"] as const) {
    await nav.getByRole("link", { name: es.nav[key] }).click();
    await expect(page).toHaveURL(`/es/${key}`);
    await expect(nav.getByRole("link", { name: es.nav[key] })).toHaveAttribute(
      "aria-current",
      "page",
    );
  }
});

test("language menu switches language and keeps the page", async ({ page }) => {
  await page.goto("/es/services");
  await page.getByRole("button", { name: es.language.label }).click();
  await page.getByRole("link", { name: "English" }).click();
  await expect(page).toHaveURL("/en/services");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});

test("branch dropdown shows the chosen branch", async ({ page }) => {
  const [, second] = (await getTenant()).branches;
  if (!second) throw new Error("sample tenant needs two branches");
  await page.goto("/es/home");
  await page
    .getByRole("combobox", { name: es.branch.label })
    .selectOption(second.slug);
  await expect(page.getByText(second.address.join(", "))).toBeVisible();
  await expect(
    page.getByRole("link", { name: es.branch.call }).first(),
  ).toHaveAttribute("href", `tel:${second.phone}`);
});

test("branches page lists every branch", async ({ page }) => {
  const { branches } = await getTenant();
  await page.goto("/es/branches");
  for (const branch of branches) {
    await expect(
      page.getByRole("heading", { level: 2, name: branch.name }),
    ).toBeVisible();
  }
});
