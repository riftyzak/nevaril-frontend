import { expect, test } from "@playwright/test"

async function resetE2E(page, options = {}) {
  const role = options.role ?? "owner"
  const staff = options.staff ?? "st-1"
  const tenant = options.tenant ?? "barber"
  await page.goto(`/cs/t/${tenant}/book?__e2e=reset&__role=${role}&__staff=${staff}`)
  await expect(page).toHaveURL(new RegExp(`/cs/t/${tenant}/book`))
}

test("booking happy path", async ({ page }) => {
  await resetE2E(page, { role: "owner" })

  await page.getByTestId("service-open-svc-cut").click()
  await page.getByTestId("variant-option-60").click()
  await page.locator('[data-testid^="slot-option-"]').first().click()

  await page.getByTestId("booking-name").fill("E2E User")
  await page.getByTestId("booking-email").fill("e2e@example.com")
  await page.getByTestId("booking-phone").fill("+420777123123")
  await page.getByTestId("booking-submit").click()

  await expect(page).toHaveURL(/\/cs\/t\/barber\/book\/confirmation\?/)
  await expect(page.getByTestId("manage-booking-link")).toBeVisible()
})

test("manage reschedule from confirmation", async ({ page }) => {
  await resetE2E(page, { role: "owner" })

  await page.getByTestId("service-open-svc-cut").click()
  await page.locator('[data-testid^="slot-option-"]').first().click()
  await page.getByTestId("booking-name").fill("Manage User")
  await page.getByTestId("booking-email").fill("manage@example.com")
  await page.getByTestId("booking-phone").fill("+420777111222")
  await page.getByTestId("booking-submit").click()
  await page.getByTestId("manage-booking-link").click()

  await expect(page).toHaveURL(/\/cs\/m\//)
  await page.getByTestId("manage-reschedule-link").click()
  const targetSlot = page.locator('[data-testid^="slot-option-"]').nth(1)
  const targetLabel = await targetSlot.textContent()
  await targetSlot.click()
  await page.getByTestId("manage-confirm-reschedule").click()

  await expect(page).toHaveURL(/\/cs\/m\//)
  if (targetLabel) {
    await expect(page.locator("body")).toContainText(targetLabel.trim())
  }
})

test("owner create/edit service persists after reload", async ({ page }) => {
  await resetE2E(page, { role: "owner" })
  await page.goto("/cs/app/barber/services")

  await page.getByTestId("admin-service-link-svc-cut").click()
  const nextName = `Haircut E2E ${Date.now()}`
  const nextDescription = "Updated by Playwright smoke test"
  await page.getByTestId("admin-service-name").fill(nextName)
  await page.getByTestId("admin-service-description").fill(nextDescription)
  await page.getByTestId("admin-service-save").click()

  await page.reload()
  await expect(page.getByTestId("admin-service-name")).toHaveValue(nextName)
  await expect(page.getByTestId("admin-service-description")).toHaveValue(nextDescription)
})

test("waitlist create + assign to slot", async ({ page }) => {
  await resetE2E(page, { role: "owner" })
  await page.goto("/cs/t/barber/waitlist")

  await page.getByTestId("waitlist-service").selectOption("svc-cut")
  await page.getByTestId("waitlist-name").fill("Waitlist User")
  await page.getByTestId("waitlist-email").fill("waitlist@example.com")
  await page.getByTestId("waitlist-phone").fill("+420777333444")
  await page.getByTestId("waitlist-submit").click()

  await page.goto("/cs/app/barber/waitlist")
  const assignButton = page.locator('[data-testid^="waitlist-assign-"]').last()
  await assignButton.click()
  await page.locator('[data-testid^="waitlist-slot-"]').first().click()
  await page.getByTestId("waitlist-assign-confirm").click()

  await expect(page.getByTestId("waitlist-notification-preview")).toBeVisible()
})

test("rbac redirect for staff to owner-only route", async ({ page }) => {
  await resetE2E(page, { role: "staff", staff: "st-1" })
  await page.goto("/cs/app/barber/roles")
  await expect(page).toHaveURL("/cs/not-authorized")
  await expect(page.getByTestId("not-authorized-screen")).toBeVisible()
})
