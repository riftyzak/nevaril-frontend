import { defineConfig, devices } from "@playwright/test"

const PORT = Number(process.env.PORT || 4200)
const AUTH_SOURCE = process.env.AUTH_SOURCE || "convex"
const NEXT_PUBLIC_AUTH_SOURCE = process.env.NEXT_PUBLIC_AUTH_SOURCE || AUTH_SOURCE
const AUTH_EMAIL_PROVIDER = process.env.AUTH_EMAIL_PROVIDER || "memory"
const AUTH_EMAIL_FROM = process.env.AUTH_EMAIL_FROM || "test@nevaril.local"
const webServerEnv = [
  `AUTH_SOURCE=${AUTH_SOURCE}`,
  `NEXT_PUBLIC_AUTH_SOURCE=${NEXT_PUBLIC_AUTH_SOURCE}`,
  `AUTH_EMAIL_PROVIDER=${AUTH_EMAIL_PROVIDER}`,
  `AUTH_EMAIL_FROM=${AUTH_EMAIL_FROM}`,
].join(" ")

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
    command: `npm run build && ${webServerEnv} E2E_BOOTSTRAP=1 npm run start -- --port ${PORT} --hostname 127.0.0.1`,
    url: `http://127.0.0.1:${PORT}/cs`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
