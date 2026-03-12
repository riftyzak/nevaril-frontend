import { cookies } from "next/headers"

import { getTenantConfigOrNull } from "@/lib/app/server"
import type { AuthAdapter, ResolveSessionInput } from "@/lib/auth/adapter"
import { parseSessionCookieValue, SESSION_COOKIE_NAME } from "@/lib/auth/session-cookie"
import type { AppSession, SessionRole } from "@/lib/auth/types"

async function resolvePlan(tenantSlug: string): Promise<AppSession["plan"]> {
  const config = await getTenantConfigOrNull(tenantSlug)
  return config?.plan ?? "starter"
}

function buildMockSession(input: {
  tenantSlug: string
  role: SessionRole
  staffId: string | null
  plan: AppSession["plan"]
}): AppSession {
  const { tenantSlug, role, staffId, plan } = input
  return {
    sessionId: `mock:${tenantSlug}:${role}:${staffId ?? "owner"}`,
    userId: role === "owner" ? `owner:${tenantSlug}` : `staff:${tenantSlug}:${staffId ?? "st-1"}`,
    role,
    tenantId: tenantSlug,
    tenantSlug,
    activeTenantSlug: tenantSlug,
    staffId,
    plan,
    authMethod: "mock",
    memberships: [
      {
        tenantId: tenantSlug,
        tenantSlug,
        role,
        staffId,
      },
    ],
    identity: {
      provider: "mock",
      email: role === "owner" ? `owner@${tenantSlug}.mock` : `staff-${staffId ?? "st-1"}@${tenantSlug}.mock`,
    },
  }
}

async function resolveCookieSession(input?: ResolveSessionInput) {
  const requestedTenant = input?.tenantSlug ?? "barber"
  const cookieStore = await cookies()
  const payload = parseSessionCookieValue(
    input?.sessionToken ?? cookieStore.get(SESSION_COOKIE_NAME)?.value
  )
  const role = payload?.role ?? "owner"
  const staffId = role === "staff" ? payload?.staffId ?? "st-1" : null
  const plan = await resolvePlan(requestedTenant)

  return buildMockSession({
    tenantSlug: requestedTenant,
    role,
    staffId,
    plan,
  })
}

export const mockAuthAdapter: AuthAdapter = {
  resolveSession: resolveCookieSession,
  signOut: async () => {},
  beginMagicLink: async () => ({
    requestedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    cooldownEndsAt: new Date(Date.now() + 60 * 1000).toISOString(),
    deliveryMode: "email_captured" as const,
  }),
  completeMagicLink: async () => {
    throw new Error("Magic link completion is not implemented in the mock auth adapter.")
  },
  beginOAuth: async () => {
    throw new Error("OAuth is not implemented in the mock auth adapter.")
  },
}
