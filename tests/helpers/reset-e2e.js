import { expect } from "@playwright/test"

export async function resetE2E(page, options = {}) {
  const role = options.role ?? "owner"
  const staff = options.staff ?? "st-1"
  const tenant = options.tenant ?? "barber"
  const expectedUrl = new RegExp(`/cs/t/${tenant}/book(?:\\?.*)?$`)

  await page.goto(`/cs/t/${tenant}/book?__e2e=reset&__role=${role}&__staff=${staff}`)

  await expect
    .poll(
      async () => new URL(page.url()).searchParams.get("__e2e"),
      {
        message: "Expected E2E bootstrap to clear the __e2e reset query param.",
      }
    )
    .toBe(null)

  await expect
    .poll(
      async () => await page.evaluate(() => document.cookie),
      {
        message: "Expected E2E bootstrap to set the mock session cookie.",
      }
    )
    .toContain("nevaril_mock_session=")

  await expect(page, {
    message: "Expected E2E bootstrap to land back on the normalized public booking URL.",
  }).toHaveURL(expectedUrl)
}
