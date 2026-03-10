import { expect, test } from "@playwright/test"

import { resetE2E } from "./helpers/reset-e2e"

test("reset bootstrap clears query params and restores owner session", async ({ page }) => {
  await resetE2E(page, { role: "owner" })

  await expect(page).toHaveURL(/\/cs\/t\/barber\/book(?:\?.*)?$/)
  await expect
    .poll(async () => await page.evaluate(() => document.cookie))
    .toContain("nevaril_mock_session=")
})

test("reset bootstrap can seed a staff session", async ({ page }) => {
  await resetE2E(page, { role: "staff", staff: "st-1" })

  await page.goto("/cs/app/barber/calendar")
  await expect(page.getByTestId("calendar-staff-filter")).toHaveValue("st-1")
})
