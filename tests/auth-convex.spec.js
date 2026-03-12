import { expect, test } from "@playwright/test"

import { isConvexAuthMode } from "./helpers/auth-mode"
import { isConvexPrimaryMode } from "./helpers/runtime-mode"

const AUTH_SESSION_COOKIE_NAME = "nevaril_auth_session"
const OWNER_EMAIL = "martin.novak@barber.test"
const STAFF_EMAIL = "tomas.kral@barber.test"

test.skip(
  !(isConvexPrimaryMode && isConvexAuthMode),
  "Backend auth smoke requires Convex app runtime and AUTH_SOURCE=convex."
)

async function requestMagicLink(page, email) {
  await page.goto("/cs/auth/sign-in?tenantSlug=barber")
  await page.getByTestId("auth-email").fill(email)
  await page.getByTestId("auth-request-submit").click()
  await expect(page.getByTestId("auth-requested-card")).toBeVisible()

  const href = await page.getByTestId("auth-preview-link").getAttribute("href")
  expect(href).toBeTruthy()
  return href
}

async function signInAs(page, email) {
  const href = await requestMagicLink(page, email)
  await page.goto(href)
}

test("owner magic-link flow resolves backend session and keeps owner routes accessible", async ({
  page,
}) => {
  await signInAs(page, OWNER_EMAIL)

  await expect(page).toHaveURL("/cs/app/barber")

  const cookies = await page.context().cookies()
  expect(cookies.some((cookie) => cookie.name === AUTH_SESSION_COOKIE_NAME)).toBe(true)

  await page.goto("/cs/app/barber/tenant-settings")
  await expect(page).toHaveURL("/cs/app/barber/tenant-settings")
  await expect(page.getByTestId("not-authorized-screen")).toHaveCount(0)
})

test("staff magic-link flow resolves backend session and keeps owner-only routes denied", async ({
  page,
}) => {
  await signInAs(page, STAFF_EMAIL)

  await expect(page).toHaveURL("/cs/app/barber")

  const cookies = await page.context().cookies()
  expect(cookies.some((cookie) => cookie.name === AUTH_SESSION_COOKIE_NAME)).toBe(true)

  await page.goto("/cs/app/barber/tenant-settings")
  await expect(page).toHaveURL("/cs/not-authorized")
  await expect(page.getByTestId("not-authorized-screen")).toBeVisible()
})

test("invalid magic-link token shows the verify error screen and does not create a session", async ({
  page,
}) => {
  await page.goto("/cs/auth/verify?token=invalid-token&tenantSlug=barber")

  await expect(page).toHaveURL(/\/cs\/auth\/verify\/error\?/)
  await expect(page.getByTestId("auth-verify-error")).toBeVisible()

  const cookies = await page.context().cookies()
  expect(cookies.some((cookie) => cookie.name === AUTH_SESSION_COOKIE_NAME)).toBe(false)
})

test("sign-out clears Convex auth session and protected routes redirect back to sign-in", async ({
  page,
}) => {
  await signInAs(page, OWNER_EMAIL)
  await expect(page).toHaveURL("/cs/app/barber")

  await page.goto(
    `/cs/auth/sign-out?next=${encodeURIComponent("/cs/auth/sign-in?tenantSlug=barber")}`
  )
  await expect(page).toHaveURL("/cs/auth/sign-in?tenantSlug=barber")

  let cookies = await page.context().cookies()
  expect(cookies.some((cookie) => cookie.name === AUTH_SESSION_COOKIE_NAME)).toBe(false)

  await page.goto("/cs/app/barber/tenant-settings")
  await expect(page).toHaveURL(/\/cs\/auth\/sign-in\?tenantSlug=barber&next=/)

  cookies = await page.context().cookies()
  expect(cookies.some((cookie) => cookie.name === AUTH_SESSION_COOKIE_NAME)).toBe(false)
})
