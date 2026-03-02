import type { SessionRole } from "@/lib/auth/types"

export const SESSION_COOKIE_NAME = "nevaril_mock_session"

export interface SessionCookiePayload {
  role: SessionRole
  tenantSlug?: string
  staffId?: string | null
}

export function parseSessionCookieValue(value?: string | null): SessionCookiePayload | null {
  if (!value) return null
  try {
    const decoded = decodeURIComponent(value)
    const parsed = JSON.parse(decoded) as SessionCookiePayload
    if (parsed.role !== "owner" && parsed.role !== "staff") {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function serializeSessionCookieValue(payload: SessionCookiePayload) {
  return encodeURIComponent(JSON.stringify(payload))
}
