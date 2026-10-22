import { expect, type Page, test } from "@playwright/test";
import en from "../../src/shared/i18n/en";
import es from "../../src/shared/i18n/es";
import { CUSTOMER } from "./data";

const t = es.auth;

for (const { lang, browserLocale, dict } of [
  { lang: "es", browserLocale: "es-CL", dict: es },
  { lang: "en", browserLocale: "en-US", dict: en },
] as const) {
  test.describe(`${lang} visitor`, () => {
    test.use({ locale: browserLocale });

    test("opens on the welcome screen in their language", async ({ page }) => {
      await page.goto("/");
      await expect(page).toHaveURL(`/${lang}`);
      await expect(page.locator("html")).toHaveAttribute("lang", lang);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(
        dict.welcome.title,
      );
    });
  });
}

async function swipeGetStarted(page: Page, ratio: number) {
  const knob = page.getByRole("button", { name: es.welcome.start });
  const box = await knob.boundingBox();
  if (!box) throw new Error("get started button has no box");
  await page.mouse.move(box.x + 30, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * ratio, box.y + box.height / 2, {
    steps: 12,
  });
  await page.mouse.up();
}

test("welcome: on a computer get started goes straight to sign in", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "phones open the sheet instead");
  await page.goto("/es");
  await page.getByRole("button", { name: es.welcome.start }).click();
  await expect(page).toHaveURL("/es/login");
});

test.describe("welcome on a phone", () => {
  test.skip(({ isMobile }) => !isMobile, "computers go straight to sign in");

  test("welcome: get started opens the sheet, sign in goes to login and back", async ({
    page,
  }) => {
    await page.goto("/es");
    const sheet = page.getByRole("dialog", { name: es.welcome.sheetTitle });
    await expect(sheet).toBeHidden();
    await page.getByRole("button", { name: es.welcome.start }).click();
    await expect(sheet).toBeVisible();
    await sheet.getByRole("link", { name: t.login }).click();
    await expect(page).toHaveURL("/es/login");
    await page.getByRole("link", { name: t.back }).click();
    await expect(page).toHaveURL("/es");
  });

  test("welcome: swiping get started to the right opens the sheet", async ({
    page,
  }) => {
    await page.goto("/es");
    const sheet = page.getByRole("dialog", { name: es.welcome.sheetTitle });
    await expect(sheet).toBeHidden();
    await swipeGetStarted(page, 0.95);
    await expect(sheet).toBeVisible();
  });

  test("welcome: a half swipe snaps back and keeps the sheet closed", async ({
    page,
  }) => {
    await page.goto("/es");
    const sheet = page.getByRole("dialog", { name: es.welcome.sheetTitle });
    await swipeGetStarted(page, 0.4);
    await expect(sheet).toBeHidden();
    await page.getByRole("button", { name: es.welcome.start }).click();
    await expect(sheet).toBeVisible();
  });
});

test("login shows translated server errors, focuses the first and keeps the email", async ({
  page,
}) => {
  await page.goto("/es/login");
  const email = page.getByLabel(t.email);
  await email.fill("not-an-email");
  await page.getByLabel(t.password, { exact: true }).fill("short");
  await page.getByRole("button", { name: t.login }).click();

  await expect(page.getByText(t.errors.email)).toBeVisible();
  await expect(page.getByText(t.errors.passwordMin)).toBeVisible();
  await expect(email).toHaveAttribute("aria-invalid", "true");
  await expect(email).toBeFocused();
  await expect(email).toHaveValue("not-an-email");
});

test("a valid login enters the app", async ({ page }) => {
  await page.goto("/es/login");
  await page.getByLabel(t.email).fill(CUSTOMER.email);
  await page.getByLabel(t.password, { exact: true }).fill(CUSTOMER.password);
  await page.getByRole("button", { name: t.login }).click();
  await expect(page).toHaveURL("/es/home");
});

test("register validates, then asks to confirm the email", async ({
  page,
}, testInfo) => {
  await page.goto("/es/login");
  await page.getByRole("link", { name: t.toRegister }).click();
  await expect(page).toHaveURL("/es/register");
  await page.getByRole("button", { name: t.consent.accept }).click();
  await expect(page.getByText(t.consent.accepted)).toBeVisible();

  await page.getByLabel(t.name).fill("Ana");
  await page
    .getByLabel(t.email)
    .fill(`ana-${testInfo.project.name}-${Date.now()}@example.com`);
  await page.getByLabel(t.phone).fill("call me");
  await page.getByLabel(t.password, { exact: true }).fill("supersecret");
  await page.getByRole("button", { name: t.register }).click();
  await expect(page.getByText(t.errors.phone)).toBeVisible();

  await page.getByLabel(t.phone).fill("+56 9 1234 5678");
  await page.getByLabel(t.password, { exact: true }).fill("supersecret");
  await page.getByRole("button", { name: t.register }).click();
  await expect(page.getByText(t.recovery.registerSent)).toBeVisible();
});

test("a guest can explore without an account", async ({ page }) => {
  await page.goto("/es/login");
  await page.getByRole("link", { name: t.guest }).click();
  await expect(page).toHaveURL("/es/home");
});

test("the eye button reveals the password", async ({ page }) => {
  await page.goto("/es/login");
  const password = page.getByLabel(t.password, { exact: true });
  const toggle = page.getByRole("button", { name: t.togglePassword });
  await expect(password).toHaveAttribute("type", "password");
  await toggle.click();
  await expect(password).toHaveAttribute("type", "text");
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
});
