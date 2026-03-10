import type { AppDataSource } from "@/lib/app/source"

const VALID_APP_DATA_SOURCES = new Set<AppDataSource>(["mock", "convex"])

function readAppDataSourceEnv() {
  return {
    publicValue: process.env.NEXT_PUBLIC_APP_DATA_SOURCE,
    serverValue: process.env.APP_DATA_SOURCE,
  }
}

function assertValidAppDataSourceEnv(name: string, value: string | undefined) {
  if (!value) return

  if (!VALID_APP_DATA_SOURCES.has(value as AppDataSource)) {
    throw new Error(
      `Invalid ${name}=${value}. Expected "convex" or "mock".`
    )
  }
}

export function getResolvedAppDataSource(): AppDataSource {
  const { publicValue, serverValue } = readAppDataSourceEnv()

  assertValidAppDataSourceEnv("NEXT_PUBLIC_APP_DATA_SOURCE", publicValue)
  assertValidAppDataSourceEnv("APP_DATA_SOURCE", serverValue)

  if (publicValue && serverValue && publicValue !== serverValue) {
    throw new Error(
      `APP_DATA_SOURCE=${serverValue} does not match NEXT_PUBLIC_APP_DATA_SOURCE=${publicValue}. Set both to the same runtime mode.`
    )
  }

  return (publicValue ?? serverValue ?? "convex") as AppDataSource
}

export function getConfiguredConvexUrl() {
  return process.env.NEXT_PUBLIC_CONVEX_URL ?? process.env.CONVEX_URL ?? ""
}

export function assertAppRuntimeConfig() {
  const source = getResolvedAppDataSource()
  if (source !== "convex") {
    return { source, convexUrl: "" }
  }

  const convexUrl = getConfiguredConvexUrl()
  if (!convexUrl) {
    throw new Error(
      "Convex is the default app runtime, but NEXT_PUBLIC_CONVEX_URL (or CONVEX_URL) is missing. Configure Convex or explicitly set APP_DATA_SOURCE=mock and NEXT_PUBLIC_APP_DATA_SOURCE=mock for fallback/dev mode."
    )
  }

  return { source, convexUrl }
}
