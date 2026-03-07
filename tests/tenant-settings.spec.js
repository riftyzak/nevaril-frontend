import { expect, test } from "@playwright/test"

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

  await expect(page).toHaveURL(new RegExp(`/cs/t/${tenant}/book(?:\\?.*)?$`))
}

test("owner can save tenant settings and public readers use them", async ({ page }) => {
  const tenantName = `Barber Setup ${Date.now()}`

  await resetE2E(page, { role: "owner" })
  await page.goto("/cs/app/barber/tenant-settings")

  await page.getByLabel("Název provozovny").fill(tenantName)
  await page.getByRole("checkbox", { name: "Povolit zákazníkovi výběr pracovníka" }).uncheck()
  await page.getByLabel("Hodinové pravidlo").fill("6")
  await page.getByRole("button", { name: "Přidat pole" }).click()
  await page.getByLabel("Popisek pole").last().fill("Referral code")
  await page.getByLabel("Placeholder").last().fill("Instagram")
  await page.getByLabel("Výchozí odkaz na službu").selectOption("svc-beard")
  await page.getByLabel("Primární barva widgetu").fill("#0f766e")
  await page.getByLabel("Zaoblení widgetu").fill("20px")

  await page.getByTestId("tenant-settings-save").click({ force: true })
  await expect(page.locator('[data-testid="tenant-settings-save-bar"]')).toHaveCount(0)

  await page.reload()
  await expect(page.getByLabel("Název provozovny")).toHaveValue(tenantName)
  await expect(page.getByLabel("Hodinové pravidlo")).toHaveValue("6")
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
  await page.getByTestId("variant-option-60").click()
  await page.locator('a[href*="/book/svc-cut/slot"]').click()
  await page.locator('[data-testid^="slot-option-"]').first().click()

  await expect(page.getByLabel("Referral code")).toBeVisible()
  await page.getByTestId("booking-name").fill("Settings User")
  await page.getByTestId("booking-email").fill("settings@example.com")
  await page.getByTestId("booking-phone").fill("+420777456789")
  await page.getByLabel("Referral code").fill("Instagram")
  await page.getByTestId("booking-submit").click()

  await expect(page.getByTestId("manage-booking-link")).toBeVisible()
  await page.getByTestId("manage-booking-link").click()
  await expect(page.getByText("Změny jsou možné nejpozději 6h před začátkem.")).toBeVisible()
})

test("staff is blocked from tenant settings", async ({ page }) => {
  await resetE2E(page, { role: "staff", staff: "st-1" })
  await page.goto("/cs/app/barber/tenant-settings")
  await expect(page).toHaveURL("/cs/not-authorized")
  await expect(page.getByTestId("not-authorized-screen")).toBeVisible()
})
