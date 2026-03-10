import { defineConfig, devices } from "@playwright/test"

const PORT = Number(process.env.PORT || 4200)

export default defineConfig({
  testDir: "./tests",
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: "on-first-retry",
    headless: true,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: `npm run build && E2E_BOOTSTRAP=1 npm run start -- --port ${PORT}`,
    url: `http://127.0.0.1:${PORT}/cs`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
