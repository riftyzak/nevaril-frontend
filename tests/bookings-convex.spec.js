import { expect, test } from "@playwright/test"

const appDataSource = process.env.NEXT_PUBLIC_APP_DATA_SOURCE ?? process.env.APP_DATA_SOURCE ?? "mock"
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL ?? process.env.CONVEX_URL ?? ""

test.skip(
  appDataSource !== "convex" || !convexUrl,
  "Convex booking read smoke requires APP_DATA_SOURCE=convex and NEXT_PUBLIC_CONVEX_URL."
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

test("owner admin bookings list renders Convex booking data", async ({ page }) => {
  await resetE2E(page, { role: "owner" })
  await page.goto("/cs/app/barber/bookings")

  await expect(page.getByRole("link", { name: "Anna Novakova" })).toBeVisible()
  await expect(page.getByText("Marek Sramek")).toBeVisible()
  await expect(page.getByText("confirmed")).toBeVisible()
  await expect(page.getByText("rescheduled")).toBeVisible()
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
