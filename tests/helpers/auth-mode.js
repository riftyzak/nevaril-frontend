const VALID_AUTH_SOURCES = new Set(["mock", "convex"])

function assertValidAuthSourceEnv(name, value) {
  if (!value) return

  if (!VALID_AUTH_SOURCES.has(value)) {
    throw new Error(`Invalid ${name}=${value}. Expected "convex" or "mock".`)
  }
}

function resolveAuthSource() {
  const publicValue = process.env.NEXT_PUBLIC_AUTH_SOURCE
  const serverValue = process.env.AUTH_SOURCE

  assertValidAuthSourceEnv("NEXT_PUBLIC_AUTH_SOURCE", publicValue)
  assertValidAuthSourceEnv("AUTH_SOURCE", serverValue)

  if (publicValue && serverValue && publicValue !== serverValue) {
    throw new Error(
      `AUTH_SOURCE=${serverValue} does not match NEXT_PUBLIC_AUTH_SOURCE=${publicValue}. Set both to the same auth runtime mode.`
    )
  }

  return publicValue ?? serverValue ?? "mock"
}

export const authSource = resolveAuthSource()
export const isConvexAuthMode = authSource === "convex"
export const isExplicitMockAuthMode = authSource === "mock"
