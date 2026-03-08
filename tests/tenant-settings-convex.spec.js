import { expect, test } from "@playwright/test"

const appDataSource = process.env.NEXT_PUBLIC_APP_DATA_SOURCE ?? process.env.APP_DATA_SOURCE ?? "mock"
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL ?? process.env.CONVEX_URL ?? ""

test.skip(
  appDataSource !== "convex" || !convexUrl,
  "Convex tenant settings smoke requires APP_DATA_SOURCE=convex and NEXT_PUBLIC_CONVEX_URL."
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

test("owner can save tenant settings and reload persisted Convex values", async ({ page }) => {
  const stamp = Date.now()
  const tenantName = `Convex Barber ${stamp}`
  const logoUrl = `https://example.com/logo-${stamp}.png`
  const policyText = `Convex policy ${stamp}`
  const customFieldLabel = `Referral ${stamp}`
  const customFieldValue = `Source ${stamp}`

  await resetE2E(page, { role: "owner" })
  await page.goto("/cs/app/barber/tenant-settings")

  const staffSelectionToggle = page.getByRole("checkbox", {
    name: "Povolit zákazníkovi výběr pracovníka",
  })
  const shouldEnableStaffSelection = !(await staffSelectionToggle.isChecked())

  await page.getByLabel("Název provozovny").fill(tenantName)
  await page.getByLabel("URL loga").fill(logoUrl)
  await page.getByLabel("Text storno politiky").fill(policyText)
  await page.getByLabel("Hodinové pravidlo").fill("12")

  if (shouldEnableStaffSelection) {
    await staffSelectionToggle.check()
  } else {
    await staffSelectionToggle.uncheck()
  }

  await page.getByRole("button", { name: "Přidat pole" }).click()
  await page.getByLabel("Popisek pole").last().fill(customFieldLabel)
  await page.getByLabel("Placeholder").last().fill(customFieldValue)
  await page.getByLabel("Výchozí odkaz na službu").selectOption("svc-beard")
  await page.getByLabel("Primární barva widgetu").fill("#0f766e")
  await page.getByLabel("Zaoblení widgetu").fill("20px")

  await page.getByTestId("tenant-settings-save").click({ force: true })
  await expect(page.locator('[data-testid="tenant-settings-save-bar"]')).toHaveCount(0)

  await page.reload()
  await expect(page.getByLabel("Název provozovny")).toHaveValue(tenantName)
  await expect(page.getByLabel("URL loga")).toHaveValue(logoUrl)
  await expect(page.getByLabel("Text storno politiky")).toHaveValue(policyText)
  await expect(page.getByLabel("Hodinové pravidlo")).toHaveValue("12")
  await expect(staffSelectionToggle).toHaveJSProperty("checked", shouldEnableStaffSelection)
  await expect(page.getByLabel("Popisek pole").last()).toHaveValue(customFieldLabel)
  await expect(page.getByLabel("Placeholder").last()).toHaveValue(customFieldValue)
  await expect(page.getByLabel("Výchozí odkaz na službu")).toHaveValue("svc-beard")
  await expect(page.getByLabel("Primární barva widgetu")).toHaveValue("#0f766e")
  await expect(page.getByLabel("Zaoblení widgetu")).toHaveValue("20px")

  await page.goto("/cs/app/barber/embed")
  await expect(page.getByLabel("Vyberte službu")).toHaveValue("svc-beard")
  await expect(page.getByLabel("Primární barva")).toHaveValue("#0f766e")
  await expect(page.getByLabel("Radius")).toHaveValue("20px")

  await page.goto("/cs/t/barber/book")
  await expect(page.getByText(tenantName)).toBeVisible()
  await page.getByTestId("service-open-svc-cut").click()

  if (shouldEnableStaffSelection) {
    await expect(page.getByTestId("staff-select")).toBeVisible()
  } else {
    await expect(page.getByTestId("staff-select")).toHaveCount(0)
  }
})

test("staff is blocked from tenant settings in Convex mode", async ({ page }) => {
  await resetE2E(page, { role: "staff", staff: "st-1" })
  await page.goto("/cs/app/barber/tenant-settings")
  await expect(page).toHaveURL("/cs/not-authorized")
  await expect(page.getByTestId("not-authorized-screen")).toBeVisible()
})
