import { expect, test } from "@playwright/test"

const appDataSource = process.env.NEXT_PUBLIC_APP_DATA_SOURCE ?? process.env.APP_DATA_SOURCE ?? "mock"
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL ?? process.env.CONVEX_URL ?? ""

test.skip(
  appDataSource !== "convex" || !convexUrl,
  "Convex booking update/cancel smoke requires APP_DATA_SOURCE=convex and NEXT_PUBLIC_CONVEX_URL."
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

  await expect(page).toHaveURL(new RegExp(`/cs/t/${tenant}/book(?:\\?.*)?$`))
}

function formatBookingDateOffset(days) {
  const date = new Date()
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function toPragueDateTimeLocal(iso) {
  const values = Object.fromEntries(
    new Intl.DateTimeFormat("sv-SE", {
      timeZone: "Europe/Prague",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(new Date(iso))
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  )

  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`
}

async function createPublicBooking(page, { customerName, dateOffsetDays }) {
  await page.goto(`/cs/t/barber/book/svc-cut/slot?variant=60&date=${formatBookingDateOffset(dateOffsetDays)}`)

  const slotLink = page.locator('[data-testid^="slot-option-"]').first()
  await expect(slotLink).toBeVisible()

  const slotHref = await slotLink.getAttribute("href")
  const slotUrl = new URL(String(slotHref), page.url())
  const startAt = slotUrl.searchParams.get("startAt")
  if (!startAt) {
    throw new Error("Missing startAt in selected slot href")
  }

  await slotLink.click()
  await page.getByTestId("booking-name").fill(customerName)
  await page.getByTestId("booking-email").fill(`${customerName.replace(/\s+/g, "-").toLowerCase()}@example.com`)
  await page.getByTestId("booking-phone").fill("+420777666111")
  await page.getByTestId("booking-submit").click()

  await expect(page).toHaveURL(/\/cs\/t\/barber\/book\/confirmation\?/)
  await expect(page.locator("main")).toContainText(customerName)

  const manageHref = await page.getByTestId("manage-booking-link").getAttribute("href")
  if (!manageHref) {
    throw new Error("Missing manage booking href")
  }

  return {
    customerName,
    manageHref,
    startAt,
  }
}

async function openBookingFromAdminList(page, customerName) {
  await page.goto("/cs/app/barber/bookings")
  await page.getByRole("link", { name: customerName }).click()
}

function manageDateRow(page) {
  return page.locator("p").filter({ hasText: "Datum a čas:" }).first()
}

test("manage reschedule persists after reload in Convex mode", async ({ page }) => {
  await resetE2E(page, { role: "owner" })
  const booking = await createPublicBooking(page, {
    customerName: `Convex Reschedule ${Date.now()}`,
    dateOffsetDays: 21,
  })

  await page.goto(booking.manageHref)
  const originalDate = await manageDateRow(page).textContent()

  await page.getByTestId("manage-reschedule-link").click()
  const targetSlot = page.locator('[data-testid^="slot-option-"]').first()
  await targetSlot.click()
  await page.getByTestId("manage-confirm-reschedule").click()

  await expect(page.locator("main")).toContainText("rescheduled")
  const updatedDate = await manageDateRow(page).textContent()
  expect(updatedDate).not.toBe(originalDate)

  await page.reload()
  await expect(page.locator("main")).toContainText("rescheduled")
  await expect(manageDateRow(page)).toHaveText(String(updatedDate))
})

test("manage cancel persists after reload in Convex mode", async ({ page }) => {
  await resetE2E(page, { role: "owner" })
  const booking = await createPublicBooking(page, {
    customerName: `Convex Cancel ${Date.now()}`,
    dateOffsetDays: 28,
  })

  await page.goto(booking.manageHref)
  await page.getByTestId("manage-cancel-button").click()
  await page.getByTestId("manage-confirm-cancel").click()

  await expect(page.locator("main")).toContainText("Rezervace byla zrušena.")
  await expect(page.locator("main")).toContainText("Zrušena")

  await page.reload()
  await expect(page.locator("main")).toContainText("Zrušena")
})

test("admin booking detail cancel persists after reload in Convex mode", async ({ page }) => {
  await resetE2E(page, { role: "owner" })
  const booking = await createPublicBooking(page, {
    customerName: `Convex Admin Cancel ${Date.now()}`,
    dateOffsetDays: 35,
  })

  await openBookingFromAdminList(page, booking.customerName)
  await page.getByTestId("admin-booking-cancel-button").click()

  await expect(page.getByText("Rezervace zrušena")).toBeVisible()
  await expect(page.locator("main")).toContainText("Stav: cancelled")

  await page.reload()
  await expect(page.locator("main")).toContainText("Stav: cancelled")
})

test("admin booking detail rejects conflicting reschedule in Convex mode", async ({ page }) => {
  await resetE2E(page, { role: "owner" })
  const firstBooking = await createPublicBooking(page, {
    customerName: `Convex Conflict A ${Date.now()}`,
    dateOffsetDays: 42,
  })
  const secondBooking = await createPublicBooking(page, {
    customerName: `Convex Conflict B ${Date.now()}`,
    dateOffsetDays: 42,
  })

  await openBookingFromAdminList(page, secondBooking.customerName)
  await page
    .getByTestId("admin-booking-reschedule-input")
    .fill(toPragueDateTimeLocal(firstBooking.startAt))
  await page.getByTestId("admin-booking-reschedule-button").click()

  await expect(page.getByText("Přesun selhal")).toBeVisible()
  await expect(page.locator("main")).toContainText("Stav: confirmed")

  await page.reload()
  await expect(page.locator("main")).toContainText("Stav: confirmed")
})
