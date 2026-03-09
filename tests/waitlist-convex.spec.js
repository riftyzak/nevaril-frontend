import { expect, test } from "@playwright/test"

const appDataSource = process.env.NEXT_PUBLIC_APP_DATA_SOURCE ?? process.env.APP_DATA_SOURCE ?? "mock"
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL ?? process.env.CONVEX_URL ?? ""

test.skip(
  appDataSource !== "convex" || !convexUrl,
  "Convex waitlist smoke requires APP_DATA_SOURCE=convex and NEXT_PUBLIC_CONVEX_URL."
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

function formatDateOffset(days) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`
}

function waitlistRow(page, customerName) {
  return page.locator("tbody tr").filter({ hasText: customerName }).first()
}

async function createPublicWaitlistEntry(page, input = {}) {
  const customerName = input.customerName ?? `Convex Waitlist ${Date.now()}`
  const customerEmail = input.customerEmail ?? `${customerName.toLowerCase().replace(/\s+/g, "-")}@example.com`
  const customerPhone = input.customerPhone ?? "+420777333444"
  const preferredDate = input.preferredDate ?? formatDateOffset(14)

  await page.goto("/cs/t/barber/waitlist")
  await page.getByTestId("waitlist-service").selectOption("svc-cut")
  await page.getByTestId("waitlist-date").fill(preferredDate)
  await page.getByTestId("waitlist-window").selectOption("afternoon")
  await page.getByTestId("waitlist-name").fill(customerName)
  await page.getByTestId("waitlist-email").fill(customerEmail)
  await page.getByTestId("waitlist-phone").fill(customerPhone)
  await page.getByTestId("waitlist-submit").click()

  return {
    customerName,
    customerEmail,
    customerPhone,
    preferredDate,
  }
}

test("public waitlist create succeeds in Convex mode", async ({ page }) => {
  await resetE2E(page, { role: "owner" })
  const customer = await createPublicWaitlistEntry(page)

  await expect(page.locator("main")).toContainText("Jste v čekací listině")
  await expect(page.locator("main")).toContainText("Jakmile se uvolní termín, ozveme se vám.")

  await page.goto("/cs/app/barber/waitlist")
  await expect(waitlistRow(page, customer.customerName)).toContainText(customer.customerEmail)
})

test("admin waitlist list renders seeded Convex data", async ({ page }) => {
  await resetE2E(page, { role: "owner" })
  await page.goto("/cs/app/barber/waitlist")

  await expect(waitlistRow(page, "Iva Horakova")).toContainText("Haircut")
  await expect(waitlistRow(page, "Iva Horakova")).toContainText("Nové")
})

test("admin assign to slot persists and creates a booking in Convex mode", async ({ page }) => {
  const customer = await createPublicWaitlistEntry(page, {
    customerName: `Convex Assign ${Date.now()}`,
    preferredDate: formatDateOffset(21),
  })

  await resetE2E(page, { role: "owner" })
  await page.goto("/cs/app/barber/waitlist")

  const row = waitlistRow(page, customer.customerName)
  await expect(row).toBeVisible()
  await row.getByRole("button", { name: "Přiřadit do slotu" }).click()
  await page.locator('[data-testid^="waitlist-slot-"]').first().click()
  await page.getByTestId("waitlist-assign-confirm").click()

  await expect(page.getByTestId("waitlist-notification-preview")).toBeVisible()
  await page.reload()
  await expect(waitlistRow(page, customer.customerName)).toContainText("Přiřazeno")

  await page.goto("/cs/app/barber/bookings")
  await expect(page.getByRole("link", { name: customer.customerName })).toBeVisible()
})

test("staff retains current waitlist route access semantics in Convex mode", async ({ page }) => {
  await resetE2E(page, { role: "staff", staff: "st-1" })
  await page.goto("/cs/app/barber/waitlist")

  await expect(page).toHaveURL("/cs/app/barber/waitlist")
  await expect(waitlistRow(page, "Iva Horakova")).toBeVisible()
})
