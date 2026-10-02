import { defineConfig, devices } from "@playwright/test";

const port = 3200;

export default defineConfig({
  testDir: "tests/e2e",
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL: `http://127.0.0.1:${port}` },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-webkit", use: { ...devices["iPhone 15"] } },
  ],
  webServer: {
    command: `bun run start --hostname 127.0.0.1 --port ${port}`,
    url: `http://127.0.0.1:${port}/es/login`,
    reuseExistingServer: !process.env.CI,
    env: {
      ...(process.env as Record<string, string>),
      AUTH_DEMO: "true",
      BOOKING_DEMO: "true",
    },
  },
});
