import { expect, test } from "@playwright/test"

const appDataSource = process.env.NEXT_PUBLIC_APP_DATA_SOURCE ?? process.env.APP_DATA_SOURCE ?? "mock"
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL ?? process.env.CONVEX_URL ?? ""

test.skip(
  appDataSource !== "convex" || !convexUrl,
  "Convex admin calendar smoke requires APP_DATA_SOURCE=convex and NEXT_PUBLIC_CONVEX_URL."
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

function mondayOfWeek(date) {
  const value = new Date(date)
  value.setHours(0, 0, 0, 0)
  const mondayOffset = (value.getDay() + 6) % 7
  value.setDate(value.getDate() - mondayOffset)
  return value
}

async function goToWeekStart(page, targetDate) {
  const currentWeekStart = mondayOfWeek(new Date())
  const targetWeekStart = mondayOfWeek(new Date(`${targetDate}T00:00:00`))
  const diffWeeks = Math.round(
    (targetWeekStart.getTime() - currentWeekStart.getTime()) / (7 * 24 * 60 * 60 * 1000)
  )

  const buttonName = diffWeeks < 0 ? "Předchozí týden" : "Další týden"
  for (let index = 0; index < Math.abs(diffWeeks); index += 1) {
    await page.getByRole("button", { name: buttonName }).click()
  }
}

async function goToNextWeek(page) {
  await page.getByRole("button", { name: "Další týden" }).click()
}

function calendarItemByTitle(page, title) {
  return page.locator('[data-testid^="calendar-item-"]').filter({ hasText: title }).first()
}

async function createCalendarEvent(page, { mode, title, staffId, note }) {
  const trigger =
    mode === "blocked" ? "calendar-create-block" : "calendar-create-time-off"

  await page.getByTestId(trigger).click()
  if (staffId) {
    await page.getByTestId("calendar-create-staff").selectOption(staffId)
  }
  await page.locator("#calendar-create-title").fill(title)
  if (note) {
    await page.locator("#calendar-create-note").fill(note)
  }
  await page.getByTestId("calendar-create-submit").click()
  await expect(calendarItemByTitle(page, title)).toBeVisible()
}

test("owner sees seeded Convex bookings and calendar events in admin calendar", async ({ page }) => {
  await resetE2E(page, { role: "owner" })
  await page.goto("/cs/app/barber/calendar")
  await goToWeekStart(page, "2026-01-12")

  await expect(page.getByTestId("calendar-item-bk-1")).toBeVisible()
  await expect(page.getByTestId("calendar-item-bk-2")).toBeVisible()
  await expect(page.getByTestId("calendar-item-evt-block-1")).toBeVisible()
  await expect(page.getByTestId("calendar-item-evt-timeoff-1")).toBeVisible()
})

test("owner can create blocked and time off events and reload sees persisted Convex values", async ({ page }) => {
  const blockedTitle = `Convex Block ${Date.now()}`
  const timeOffTitle = `Convex Time Off ${Date.now()}`

  await resetE2E(page, { role: "owner" })
  await page.goto("/cs/app/barber/calendar")
  await goToNextWeek(page)

  await createCalendarEvent(page, {
    mode: "blocked",
    title: blockedTitle,
    staffId: "st-1",
    note: "Convex blocked note",
  })

  await createCalendarEvent(page, {
    mode: "time_off",
    title: timeOffTitle,
    staffId: "st-owner",
    note: "Convex time off note",
  })

  await page.reload()
  await goToNextWeek(page)
  await expect(calendarItemByTitle(page, blockedTitle)).toBeVisible()
  await expect(calendarItemByTitle(page, timeOffTitle)).toBeVisible()
})

test("owner can update and delete a Convex calendar event with reload parity", async ({ page }) => {
  const initialTitle = `Convex Event ${Date.now()}`
  const updatedTitle = `${initialTitle} Updated`

  await resetE2E(page, { role: "owner" })
  await page.goto("/cs/app/barber/calendar")
  await goToNextWeek(page)

  await createCalendarEvent(page, {
    mode: "blocked",
    title: initialTitle,
    staffId: "st-1",
    note: "Editable note",
  })

  await page.getByText(initialTitle).click()
  await expect(page.getByTestId("calendar-detail-panel")).toBeVisible()
  await page.locator("#calendar-event-title").fill(updatedTitle)
  await page.locator("#calendar-event-note").fill("Updated note")
  await page.getByTestId("calendar-event-save").click()

  await expect(calendarItemByTitle(page, updatedTitle)).toBeVisible()
  await page.reload()
  await goToNextWeek(page)
  await expect(calendarItemByTitle(page, updatedTitle)).toBeVisible()

  await calendarItemByTitle(page, updatedTitle).click()
  await page.getByTestId("calendar-event-delete").click()
  await expect(calendarItemByTitle(page, updatedTitle)).toHaveCount(0)

  await page.reload()
  await goToNextWeek(page)
  await expect(calendarItemByTitle(page, updatedTitle)).toHaveCount(0)
})

test("staff scope stays restricted in Convex admin calendar", async ({ page }) => {
  await resetE2E(page, { role: "staff", staff: "st-1" })
  await page.goto("/cs/app/barber/calendar")
  await goToWeekStart(page, "2026-01-12")

  await expect(page.getByTestId("calendar-staff-filter")).toBeDisabled()
  await expect(page.getByTestId("calendar-staff-filter")).toHaveValue("st-1")
  await expect(page.locator('[data-testid="calendar-staff-filter"] option')).toHaveCount(1)

  await expect(page.getByTestId("calendar-item-bk-1")).toBeVisible()
  await expect(page.getByTestId("calendar-item-evt-block-1")).toBeVisible()
  await expect(page.getByTestId("calendar-item-bk-2")).toHaveCount(0)
  await expect(page.getByTestId("calendar-item-evt-timeoff-1")).toHaveCount(0)
})
