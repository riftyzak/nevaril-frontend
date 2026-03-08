import { expect, test } from "@playwright/test"

const appDataSource = process.env.NEXT_PUBLIC_APP_DATA_SOURCE ?? process.env.APP_DATA_SOURCE ?? "mock"
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL ?? process.env.CONVEX_URL ?? ""

test.skip(
  appDataSource === "convex" && !convexUrl,
  "Convex reader mode requires NEXT_PUBLIC_CONVEX_URL or CONVEX_URL."
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
