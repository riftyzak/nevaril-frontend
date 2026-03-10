import { expect, test } from "@playwright/test"
import { resetE2E } from "./helpers/reset-e2e"
import { isConvexPrimaryMode } from "./helpers/runtime-mode"

test.skip(!isConvexPrimaryMode, "Convex reader smoke runs only in Convex-primary mode.")

test("public booking entry renders barber brand and services", async ({ page }) => {
  await resetE2E(page)
  await page.goto("/cs/t/barber/book")

  await expect(page.getByText("Brass Barber")).toBeVisible()
  await expect(page.getByTestId("service-open-svc-cut")).toBeVisible()
  await expect(page.getByTestId("service-open-svc-beard")).toBeVisible()
})

test("service detail renders barber service and staff selector", async ({ page }) => {
  await resetE2E(page)
  await page.goto("/cs/t/barber/book/svc-cut")

  await expect(page.locator('[data-slot="card-title"]').filter({ hasText: "Haircut" })).toBeVisible()
  await expect(page.getByTestId("variant-option-60")).toBeVisible()
  await expect(page.getByTestId("staff-select")).toBeVisible()
  await expect(page.locator("#staff-select option")).toContainText(["Martin Novak", "Tomas Kral"])
})

test("admin staff page renders barber staff list", async ({ page }) => {
  await resetE2E(page, { role: "owner" })
  await page.goto("/cs/app/barber/staff")

  await expect(page.locator("p.font-medium").filter({ hasText: "Martin Novak" })).toBeVisible()
  await expect(page.locator("p.font-medium").filter({ hasText: "Tomas Kral" })).toBeVisible()
})
