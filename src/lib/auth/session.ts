import { redirect } from "next/navigation"

import { getAuthAdapter } from "@/lib/auth/adapter"
import type { AppSession, TenantMembership } from "@/lib/auth/types"
import type { AppLocale } from "@/i18n/locales"
import { localePath } from "@/lib/tenant/tenant-url"

export async function resolveSession(input?: {
  tenantSlug?: string
  sessionToken?: string | null
}): Promise<AppSession> {
  return getAuthAdapter().resolveSession(input)
}

export async function requireAuthSession(input?: {
  tenantSlug?: string
  sessionToken?: string | null
}) {
  return resolveSession(input)
}

export async function requireTenantAccess(input: {
  locale?: AppLocale
  tenantSlug: string
  sessionToken?: string | null
}): Promise<{
  session: AppSession
  membership: TenantMembership
}> {
  const session = await requireAuthSession({
    tenantSlug: input.tenantSlug,
    sessionToken: input.sessionToken,
  })

  const membership = session.memberships.find((item) => item.tenantSlug === input.tenantSlug)

  if (!membership) {
    if (input.locale) {
      redirect(localePath({ locale: input.locale, path: "/not-authorized" }))
    }
    throw new Error(`No tenant membership found for ${input.tenantSlug}.`)
  }

  return { session, membership }
}
