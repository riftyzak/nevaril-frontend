import { expect, test } from "@playwright/test"
import { resetE2E } from "./helpers/reset-e2e"
import { isExplicitMockMode } from "./helpers/runtime-mode"

test.skip(
  !isExplicitMockMode,
  "Mock fallback calendar smoke requires APP_DATA_SOURCE=mock and NEXT_PUBLIC_APP_DATA_SOURCE=mock."
)

function addMinutesToInputValue(value, minutes) {
  const date = new Date(value)
  date.setMinutes(date.getMinutes() + minutes)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}T${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes()
  ).padStart(2, "0")}`
}

function addDaysToInputValue(value, days) {
  const date = new Date(value)
  date.setDate(date.getDate() + days)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}T${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes()
  ).padStart(2, "0")}`
}

test("owner can create and manage booking from calendar", async ({ page }) => {
  await resetE2E(page, { role: "owner" })
  await page.goto("/cs/app/barber/calendar")

  const customerName = `Calendar Owner ${Date.now()}`
  const isSunday = new Date().getDay() === 0

  if (isSunday) {
    await page.getByRole("button", { name: "Další týden" }).click()
  }

  await page.getByTestId("calendar-create-booking").click()
  const createStartInput = page.locator("#calendar-create-start")
  const createStartValue = await createStartInput.inputValue()
  await createStartInput.fill(addMinutesToInputValue(addDaysToInputValue(createStartValue, 2), 60))
  await page.getByLabel("Jméno zákazníka").fill(customerName)
  await page.getByLabel("E-mail").fill("calendar-owner@example.com")
  await page.getByLabel("Telefon").fill("+420777000555")
  await page.getByTestId("calendar-create-submit").click()

  const bookingItem = page.getByText(customerName)
  await expect(bookingItem).toBeVisible()

  await bookingItem.click()
  await expect(page.getByTestId("calendar-detail-panel")).toBeVisible()

  const rescheduleInput = page.locator("#calendar-booking-reschedule")
  const currentValue = await rescheduleInput.inputValue()
  await rescheduleInput.fill(addMinutesToInputValue(currentValue, 120))
  await page.getByTestId("calendar-booking-reschedule").click()

  await expect(page.getByTestId("calendar-detail-panel")).toContainText("rescheduled")

  await page.getByTestId("calendar-booking-cancel").click()
  await expect(page.getByTestId("calendar-detail-panel")).toHaveCount(0)
  await expect(page.getByText(customerName)).toHaveCount(0)
})

test("staff calendar stays locked to own scope", async ({ page }) => {
  await resetE2E(page, { role: "staff", staff: "st-1" })
  await page.goto("/cs/app/barber/calendar")
  const isSunday = new Date().getDay() === 0

  await expect(page.getByTestId("calendar-staff-filter")).toBeDisabled()
  await expect(page.getByTestId("calendar-staff-filter")).toHaveValue("st-1")
  await expect(page.locator('[data-testid="calendar-staff-filter"] option')).toHaveCount(1)

  const blockTitle = `Staff Block ${Date.now()}`

  if (isSunday) {
    await page.getByRole("button", { name: "Další týden" }).click()
  }

  await page.getByTestId("calendar-create-block").click()
  await expect(page.getByTestId("calendar-create-staff")).toBeDisabled()
  await expect(page.getByTestId("calendar-create-staff")).toHaveValue("st-1")
  await page.getByLabel("Název").fill(blockTitle)
  await page.getByTestId("calendar-create-submit").click()

  await expect(page.getByText(blockTitle)).toBeVisible()
})
