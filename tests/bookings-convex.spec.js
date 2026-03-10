import { expect, test } from "@playwright/test"
import { resetE2E } from "./helpers/reset-e2e"
import { isConvexPrimaryMode } from "./helpers/runtime-mode"

test.skip(!isConvexPrimaryMode, "Convex booking read smoke runs only in Convex-primary mode.")

test("owner admin bookings list renders Convex booking data", async ({ page }) => {
  await resetE2E(page, { role: "owner" })
  await page.goto("/cs/app/barber/bookings")

  await expect(page.getByRole("link", { name: "Anna Novakova" })).toBeVisible()
  await expect(page.getByText("Marek Sramek")).toBeVisible()
  await expect(page.locator("main")).toContainText("confirmed")
  await expect(page.locator("main")).toContainText("rescheduled")
})

test("owner admin booking detail renders Convex booking data", async ({ page }) => {
  await resetE2E(page, { role: "owner" })
  await page.goto("/cs/app/barber/bookings/bk-1")

  await expect(page.locator("main")).toContainText("Anna Novakova")
  await expect(page.locator("main")).toContainText("Stav: confirmed")
  await expect(page.locator("main")).toContainText("Pracovník: st-1")
})

test("manage route loads booking by token from Convex", async ({ page }) => {
  await resetE2E(page, { role: "owner" })
  await page.goto("/cs/m/barber-manage-1")

  await expect(page.getByText("Anna Novakova")).toBeVisible()
  await expect(page.getByText("Haircut")).toBeVisible()
  await expect(page.getByTestId("manage-reschedule-link")).toBeVisible()
})

test("staff bookings scope stays filtered to own bookings in Convex mode", async ({ page }) => {
  await resetE2E(page, { role: "staff", staff: "st-1" })
  await page.goto("/cs/app/barber/bookings")

  await expect(page.getByRole("link", { name: "Anna Novakova" })).toBeVisible()
  await expect(page.getByText("Marek Sramek")).toHaveCount(0)
})
