import type { TenantPlan, TenantConfig } from "@/lib/api/types"

export type SessionRole = "owner" | "staff"
export type AuthMethod = "mock" | "magic_link" | "google_oauth" | "password"

export interface TenantMembership {
  tenantId: string
  tenantSlug: string
  role: SessionRole
  staffId: string | null
}

export interface AuthIdentity {
  provider: AuthMethod
  email?: string
}

export interface AppSession {
  sessionId: string
  userId: string
  role: SessionRole
  tenantId: string
  tenantSlug: string
  activeTenantSlug: string
  staffId: string | null
  plan: TenantPlan
  authMethod: AuthMethod
  memberships: TenantMembership[]
  identity: AuthIdentity
}

export type MockSession = AppSession

export type PermissionModule =
  | "calendar"
  | "bookings"
  | "customers"
  | "services"
  | "staff"
  | "billing"
  | "notifications"
  | "roles"
  | "tenantSettings"

export type PermissionAbility =
  | "view"
  | "create"
  | "update"
  | "delete"
  | "manageOwn"
  | "manageAll"

export type PermissionScope = "own" | "all" | "all_readonly" | "none"

export interface PermissionContext {
  assignedStaffId?: string | null
  assignedStaffIds?: Array<string | null>
}

export interface TenantPermissionSettings {
  customersVisibility: TenantConfig["customersVisibility"]
}
