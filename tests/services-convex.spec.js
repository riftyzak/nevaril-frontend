import { expect, test } from "@playwright/test"
import { resetE2E } from "./helpers/reset-e2e"
import { isConvexPrimaryMode } from "./helpers/runtime-mode"

test.skip(!isConvexPrimaryMode, "Convex service smoke runs only in Convex-primary mode.")

test("owner can edit a service and read persisted Convex values after reload", async ({ page }) => {
  const stamp = Date.now()
  const nextName = `Haircut Convex ${stamp}`
  const nextDescription = `Convex service description ${stamp}`

  await resetE2E(page, { role: "owner" })
  await page.goto("/cs/app/barber/services/svc-cut")

  await page.getByTestId("admin-service-name").fill(nextName)
  await page.getByTestId("admin-service-description").fill(nextDescription)
  await page.getByTestId("admin-service-save").click()

  await page.reload()
  await expect(page.getByTestId("admin-service-name")).toHaveValue(nextName)
  await expect(page.getByTestId("admin-service-description")).toHaveValue(nextDescription)

  await page.goto("/cs/app/barber/services")
  await expect(page.getByTestId("admin-service-link-svc-cut")).toContainText(nextName)

  await page.goto("/cs/t/barber/book")
  await page.getByTestId("service-open-svc-cut").click()
  await expect(page.locator('[data-slot="card-title"]').filter({ hasText: nextName })).toBeVisible()
  await expect(page.locator('[data-slot="card-description"]').filter({ hasText: nextDescription })).toBeVisible()
})

test("staff keeps view-only service access in Convex mode", async ({ page }) => {
  await resetE2E(page, { role: "staff", staff: "st-1" })
  await page.goto("/cs/app/barber/services/svc-cut")

  await expect(page.getByTestId("admin-service-name")).toBeDisabled()
  await expect(page.getByTestId("admin-service-description")).toBeDisabled()
  await expect(page.getByTestId("admin-service-save")).toBeDisabled()
})
