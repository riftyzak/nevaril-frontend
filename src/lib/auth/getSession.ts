import { cookies } from "next/headers"

import type { MockSession } from "@/lib/auth/types"
import { parseSessionCookieValue, SESSION_COOKIE_NAME } from "@/lib/auth/session-cookie"
import { getDb } from "@/lib/mock/storage"

interface GetSessionInput {
  tenantSlug?: string
}

function resolvePlan(tenantSlug: string): MockSession["plan"] {
  const tenant = getDb().tenants[tenantSlug]
  return tenant?.config.plan ?? "starter"
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
    plan: resolvePlan(tenantSlug),
  }
}
