import { expect, test } from "@playwright/test"

import { isConvexAuthMode } from "./helpers/auth-mode"
import { isConvexPrimaryMode } from "./helpers/runtime-mode"

const AUTH_SESSION_COOKIE_NAME = "nevaril_auth_session"

test.skip(
  !(isConvexPrimaryMode && isConvexAuthMode),
  "Backend auth smoke requires Convex app runtime and AUTH_SOURCE=convex."
)

async function signInAs(page, role) {
  await page.goto("/cs/auth/sign-in?tenantSlug=barber")
  await page.getByRole("button", { name: `Continue as ${role}` }).click()
}

test("seeded owner handoff resolves backend session and keeps owner routes accessible", async ({
  page,
}) => {
  await signInAs(page, "owner")

  await expect(page).toHaveURL("/cs/app/barber")

  const cookies = await page.context().cookies()
  expect(cookies.some((cookie) => cookie.name === AUTH_SESSION_COOKIE_NAME)).toBe(true)

  await page.goto("/cs/app/barber/tenant-settings")
  await expect(page).toHaveURL("/cs/app/barber/tenant-settings")
  await expect(page.getByTestId("not-authorized-screen")).toHaveCount(0)
})

test("seeded staff handoff resolves backend session and keeps owner-only routes denied", async ({
  page,
}) => {
  await signInAs(page, "staff")

  await expect(page).toHaveURL("/cs/app/barber")

  const cookies = await page.context().cookies()
  expect(cookies.some((cookie) => cookie.name === AUTH_SESSION_COOKIE_NAME)).toBe(true)

  await page.goto("/cs/app/barber/tenant-settings")
  await expect(page).toHaveURL("/cs/not-authorized")
  await expect(page.getByTestId("not-authorized-screen")).toBeVisible()
})
