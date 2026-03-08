import { expect, test } from "@playwright/test"

const appDataSource = process.env.NEXT_PUBLIC_APP_DATA_SOURCE ?? process.env.APP_DATA_SOURCE ?? "mock"
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL ?? process.env.CONVEX_URL ?? ""

test.skip(
  appDataSource !== "convex" || !convexUrl,
  "Convex booking create smoke requires APP_DATA_SOURCE=convex and NEXT_PUBLIC_CONVEX_URL."
)

async function resetE2E(page, options = {}) {
  const role = options.role ?? "owner"
  const staff = options.staff ?? "st-1"
  const tenant = options.tenant ?? "barber"

  await page.goto(`/cs/t/${tenant}/book?__e2e=reset&__role=${role}&__staff=${staff}`)

  await expect
    .poll(async () => new URL(page.url()).searchParams.get("__e2e"))
    .toBe(null)

  await expect
    .poll(async () => await page.evaluate(() => document.cookie))
    .toContain("nevaril_mock_session=")
}

async function createPublicBooking(page, customerName) {
  await page.goto("/cs/t/barber/book")
  await page.getByTestId("service-open-svc-cut").click()
  await page.getByTestId("variant-option-60").click()
  await page.locator('a[href*="/book/svc-cut/slot"]').click()
  await page.locator('[data-testid^="slot-option-"]').first().click()
  await page.getByTestId("booking-name").fill(customerName)
  await page.getByTestId("booking-email").fill("convex-create@example.com")
  await page.getByTestId("booking-phone").fill("+420777666111")
  await page.getByTestId("booking-submit").click()
}

test("public booking happy path creates a Convex booking", async ({ page }) => {
  const customerName = `Convex Create ${Date.now()}`

  await resetE2E(page, { role: "owner" })
  await createPublicBooking(page, customerName)

  await expect(page).toHaveURL(/\/cs\/t\/barber\/book\/confirmation\?/)
  await expect(page.locator("main")).toContainText(customerName)
  await expect(page.locator("main")).toContainText("Haircut")
})

test("confirmation page shows the created Convex booking", async ({ page }) => {
  const customerName = `Convex Confirm ${Date.now()}`

  await resetE2E(page, { role: "owner" })
  await createPublicBooking(page, customerName)

  await expect(page.locator("main")).toContainText(customerName)
  await expect(page.getByTestId("manage-booking-link")).toBeVisible()
})

test("manage route opens the created Convex booking by token", async ({ page }) => {
  const customerName = `Convex Manage ${Date.now()}`

  await resetE2E(page, { role: "owner" })
  await createPublicBooking(page, customerName)
  await page.getByTestId("manage-booking-link").click()

  await expect(page).toHaveURL(/\/cs\/m\//)
  await expect(page.locator("main")).toContainText(customerName)
  await expect(page.locator("main")).toContainText("Haircut")
})
