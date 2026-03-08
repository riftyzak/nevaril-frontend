import { cookies } from "next/headers"

import { getTenantConfig } from "@/lib/app/client"
import type { MockSession } from "@/lib/auth/types"
import { parseSessionCookieValue, SESSION_COOKIE_NAME } from "@/lib/auth/session-cookie"

interface GetSessionInput {
  tenantSlug?: string
}

async function resolvePlan(tenantSlug: string): Promise<MockSession["plan"]> {
  const result = await getTenantConfig(tenantSlug)
  return result.ok ? result.data.plan : "starter"
}

export async function getSession(input?: GetSessionInput): Promise<MockSession> {
  const requestedTenant = input?.tenantSlug ?? "barber"
  const cookieStore = await cookies()
  const payload = parseSessionCookieValue(cookieStore.get(SESSION_COOKIE_NAME)?.value)

  const tenantSlug = requestedTenant
  const role = payload?.role ?? "owner"
  const staffId = role === "staff" ? payload?.staffId ?? "st-1" : null

  return {
    role,
    tenantId: tenantSlug,
    tenantSlug,
    staffId,
    plan: await resolvePlan(tenantSlug),
  }
}
