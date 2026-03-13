import { assertAuthRuntimeConfig, getResolvedAuthSource } from "@/lib/auth/runtime-config"

export type AuthSource = "mock" | "convex"

export const DEFAULT_AUTH_SOURCE: AuthSource = "convex"

export function getAuthSource(): AuthSource {
  const source = getResolvedAuthSource()
  if (source === "convex") {
    assertAuthRuntimeConfig()
  }

  return source
}
