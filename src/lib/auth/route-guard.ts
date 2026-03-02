import { redirect } from "next/navigation"

import { getSession } from "@/lib/auth/getSession"
import { can } from "@/lib/auth/permissions"
import type { AppLocale } from "@/i18n/locales"
import type {
  MockSession,
  PermissionAbility,
  PermissionContext,
  PermissionModule,
  TenantPermissionSettings,
} from "@/lib/auth/types"
import { getDb } from "@/lib/mock/storage"
import { localePath } from "@/lib/tenant/tenant-url"

interface RequireAccessInput {
  locale: string
  tenantSlug: string
  module: PermissionModule
  ability: PermissionAbility
  context?: PermissionContext
}

export function getTenantPermissionSettings(tenantSlug: string): TenantPermissionSettings {
  const tenant = getDb().tenants[tenantSlug]
  const visibility =
    tenant?.config.customersVisibility ??
    (tenant?.config.customerReadMode === "served-only" ? "own" : "all_readonly")
  return {
    customersVisibility: visibility,
  }
}

export async function requireRouteAccess(input: RequireAccessInput): Promise<{
  session: MockSession
  tenantSettings: TenantPermissionSettings
}> {
  const session = await getSession({ tenantSlug: input.tenantSlug })
  const tenantSettings = getTenantPermissionSettings(input.tenantSlug)
  const allowed = can(
    session,
    input.module,
    input.ability,
    input.context,
    tenantSettings
  )

  if (!allowed) {
    redirect(localePath({ locale: input.locale as AppLocale, path: "/not-authorized" }))
  }

  return { session, tenantSettings }
}
