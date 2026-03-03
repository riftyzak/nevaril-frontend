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
import { requiredPlanForFeature, isFeatureEnabled } from "@/lib/plans/gates"
import type { PlanFeature } from "@/lib/plans/features"
import { adminAppPath } from "@/lib/tenant/tenant-url"

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

interface RequirePlanInput {
  locale: AppLocale
  tenantSlug: string
  feature: PlanFeature
  session: MockSession
}

export function requirePlanAccess(input: RequirePlanInput) {
  if (isFeatureEnabled(input.session.plan, input.feature)) {
    return
  }

  const minPlan = requiredPlanForFeature(input.feature)
  redirect(
    `${adminAppPath({
      locale: input.locale,
      tenantSlug: input.tenantSlug,
      path: "/locked",
    })}?feature=${encodeURIComponent(input.feature)}&requiredPlan=${encodeURIComponent(minPlan)}`
  )
}
