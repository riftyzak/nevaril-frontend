import type {
  AppSession,
  PermissionAbility,
  PermissionContext,
  PermissionModule,
  PermissionScope,
  TenantPermissionSettings,
} from "@/lib/auth/types"

interface ModuleAccess {
  visible: boolean
  enabled: boolean
  scope: PermissionScope
  reason?: string
}

function isOwnerOnlyModule(module: PermissionModule) {
  return module === "billing" || module === "notifications" || module === "roles" || module === "tenantSettings"
}

function matchesOwnScope(session: AppSession, context?: PermissionContext) {
  if (session.role !== "staff") return true
  if (!session.staffId) return false
  if (!context) return true

  if (context.assignedStaffId !== undefined) {
    return context.assignedStaffId === session.staffId
  }
  if (context.assignedStaffIds) {
    return context.assignedStaffIds.includes(session.staffId)
  }
  return true
}

export function getModuleAccess(
  session: AppSession,
  module: PermissionModule,
  tenantSettings: TenantPermissionSettings
): ModuleAccess {
  if (session.role === "owner") {
    return { visible: true, enabled: true, scope: "all" }
  }

  if (isOwnerOnlyModule(module)) {
    return {
      visible: true,
      enabled: false,
      scope: "none",
      reason: "ownerOnly",
    }
  }

  switch (module) {
    case "calendar":
      return { visible: true, enabled: true, scope: "own" }
    case "bookings":
      return { visible: true, enabled: true, scope: "own" }
    case "customers":
      return {
        visible: true,
        enabled: true,
        scope: tenantSettings.customersVisibility,
      }
    case "services":
      return { visible: true, enabled: true, scope: "all_readonly" }
    case "staff":
      return { visible: true, enabled: true, scope: "own" }
    default:
      return { visible: false, enabled: false, scope: "none" }
  }
}

export function can(
  session: AppSession,
  module: PermissionModule,
  ability: PermissionAbility,
  context: PermissionContext | undefined,
  tenantSettings: TenantPermissionSettings
) {
  const access = getModuleAccess(session, module, tenantSettings)
  if (!access.visible || !access.enabled || access.scope === "none") return false

  if (ability === "manageAll") {
    return access.scope === "all"
  }

  if (ability === "manageOwn") {
    return (access.scope === "own" || access.scope === "all") && matchesOwnScope(session, context)
  }

  if (ability === "view") {
    if (access.scope === "all" || access.scope === "all_readonly") return true
    return access.scope === "own" && matchesOwnScope(session, context)
  }

  if (ability === "create" || ability === "update" || ability === "delete") {
    if (access.scope === "all") return true
    if (access.scope === "own") return matchesOwnScope(session, context)
    return false
  }

  return false
}
