export type AuthSource = "mock" | "convex"

export const DEFAULT_AUTH_SOURCE: AuthSource = "mock"

export function getAuthSource(): AuthSource {
  const envValue = process.env.NEXT_PUBLIC_AUTH_SOURCE ?? process.env.AUTH_SOURCE
  return envValue === "convex" ? "convex" : DEFAULT_AUTH_SOURCE
}
