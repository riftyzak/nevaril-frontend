import type { TenantPlan, TenantConfig } from "@/lib/api/types"

export type SessionRole = "owner" | "staff"

export interface MockSession {
  role: SessionRole
  tenantId: string
  tenantSlug: string
  staffId: string | null
  plan: TenantPlan
}

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
