const VALID_APP_DATA_SOURCES = new Set(["mock", "convex"])

function assertValidAppDataSourceEnv(name, value) {
  if (!value) return

  if (!VALID_APP_DATA_SOURCES.has(value)) {
    throw new Error(`Invalid ${name}=${value}. Expected "convex" or "mock".`)
  }
}

function resolveAppDataSource() {
  const publicValue = process.env.NEXT_PUBLIC_APP_DATA_SOURCE
  const serverValue = process.env.APP_DATA_SOURCE

  assertValidAppDataSourceEnv("NEXT_PUBLIC_APP_DATA_SOURCE", publicValue)
  assertValidAppDataSourceEnv("APP_DATA_SOURCE", serverValue)

  if (publicValue && serverValue && publicValue !== serverValue) {
    throw new Error(
      `APP_DATA_SOURCE=${serverValue} does not match NEXT_PUBLIC_APP_DATA_SOURCE=${publicValue}. Set both to the same runtime mode.`
    )
  }

  return publicValue ?? serverValue ?? "convex"
}

export const appDataSource = resolveAppDataSource()
export const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL ?? process.env.CONVEX_URL ?? ""
export const isConvexPrimaryMode = appDataSource === "convex"
export const isExplicitMockMode = appDataSource === "mock"

if (isConvexPrimaryMode && !convexUrl) {
  throw new Error(
    "Convex is the default e2e runtime, but NEXT_PUBLIC_CONVEX_URL (or CONVEX_URL) is missing. Configure Convex or explicitly set APP_DATA_SOURCE=mock and NEXT_PUBLIC_APP_DATA_SOURCE=mock for fallback/dev mode."
  )
}
