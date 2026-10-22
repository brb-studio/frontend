import { defineConfig, devices } from "@playwright/test";
import { API_PORT, TENANT_HOST } from "./tests/e2e/data";

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
  webServer: [
    {
      command:
        "bun --no-env-file scripts/seed.ts --reset && bun --no-env-file src/main.ts",
      cwd: "../backend",
      url: `http://127.0.0.1:${API_PORT}/health`,
      reuseExistingServer: !process.env.CI,
      env: {
        PATH: process.env.PATH ?? "",
        MONGO_URL:
          process.env.MONGO_URL ?? "mongodb://127.0.0.1:27017/?replicaSet=rs0",
        MONGO_DB: "brb-studio_e2e",
        PORT: String(API_PORT),
      },
    },
    {
      command: `bun run start --hostname 127.0.0.1 --port ${port}`,
      url: `http://127.0.0.1:${port}/es/login`,
      reuseExistingServer: !process.env.CI,
      env: {
        ...(process.env as Record<string, string>),
        BACKEND_URL: `http://127.0.0.1:${API_PORT}`,
        DEFAULT_TENANT_HOST: TENANT_HOST,
      },
    },
  ],
});
