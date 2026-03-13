import { getConfiguredConvexUrl, getResolvedAppDataSource } from "@/lib/app/runtime-config"

import type { AuthSource } from "@/lib/auth/source"
import type { AuthEmailProvider } from "@/lib/auth/magic-link-email"

const VALID_AUTH_SOURCES = new Set<AuthSource>(["mock", "convex"])
const VALID_AUTH_EMAIL_PROVIDERS = new Set<AuthEmailProvider>(["resend", "memory"])

function readAuthSourceEnv() {
  return {
    publicValue: process.env.NEXT_PUBLIC_AUTH_SOURCE,
    serverValue: process.env.AUTH_SOURCE,
  }
}

function assertValidAuthSourceEnv(name: string, value: string | undefined) {
  if (!value) return

  if (!VALID_AUTH_SOURCES.has(value as AuthSource)) {
    throw new Error(
      `Invalid ${name}=${value}. Expected "convex" or "mock".`
    )
  }
}

export function getResolvedAuthSource(): AuthSource {
  const { publicValue, serverValue } = readAuthSourceEnv()

  assertValidAuthSourceEnv("NEXT_PUBLIC_AUTH_SOURCE", publicValue)
  assertValidAuthSourceEnv("AUTH_SOURCE", serverValue)

  if (publicValue && serverValue && publicValue !== serverValue) {
    throw new Error(
      `AUTH_SOURCE=${serverValue} does not match NEXT_PUBLIC_AUTH_SOURCE=${publicValue}. Set both to the same auth runtime mode.`
    )
  }

  return (publicValue ?? serverValue ?? "convex") as AuthSource
}

export function getResolvedAuthEmailProvider(): AuthEmailProvider {
  const provider = process.env.AUTH_EMAIL_PROVIDER ?? "resend"

  if (!VALID_AUTH_EMAIL_PROVIDERS.has(provider as AuthEmailProvider)) {
    throw new Error(
      `Invalid AUTH_EMAIL_PROVIDER=${provider}. Expected "resend" or "memory".`
    )
  }

  return provider as AuthEmailProvider
}

export function assertAuthRuntimeConfig() {
  const source = getResolvedAuthSource()
  if (source !== "convex") {
    return {
      source,
      emailProvider: null,
      emailFrom: null,
      convexUrl: "",
    }
  }

  const appSource = getResolvedAppDataSource()
  if (appSource !== "convex") {
    throw new Error(
      "Convex auth requires Convex app data. Set APP_DATA_SOURCE=convex and NEXT_PUBLIC_APP_DATA_SOURCE=convex, or explicitly switch auth back to mock mode."
    )
  }

  const convexUrl = getConfiguredConvexUrl()
  if (!convexUrl) {
    throw new Error(
      "Convex auth is the default auth runtime, but NEXT_PUBLIC_CONVEX_URL (or CONVEX_URL) is missing. Configure Convex or explicitly set AUTH_SOURCE=mock and NEXT_PUBLIC_AUTH_SOURCE=mock for fallback/dev mode."
    )
  }

  const emailProvider = getResolvedAuthEmailProvider()
  const emailFrom = process.env.AUTH_EMAIL_FROM
  if (!emailFrom) {
    throw new Error(
      "AUTH_EMAIL_FROM is required when Convex auth is enabled."
    )
  }

  if (emailProvider === "resend" && !process.env.RESEND_API_KEY) {
    throw new Error(
      "RESEND_API_KEY is required when AUTH_EMAIL_PROVIDER=resend and Convex auth is enabled."
    )
  }

  return {
    source,
    emailProvider,
    emailFrom,
    convexUrl,
  }
}
