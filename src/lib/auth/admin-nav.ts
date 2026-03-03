import type { AppLocale } from "@/i18n/locales"
import type { PermissionModule } from "@/lib/auth/types"
import type { PlanFeature } from "@/lib/plans/features"
import { PLAN_FEATURES } from "@/lib/plans/features"
import { adminAppPath } from "@/lib/tenant/tenant-url"

export interface AdminNavItem {
  key:
    | "dashboard"
    | "calendar"
    | "bookings"
    | "customers"
    | "services"
    | "staff"
    | "waitlist"
    | "notifications"
    | "loyalty"
    | "vouchers"
    | "reviews"
    | "analytics"
    | "embed"
    | "settings"
  href: string
  module: PermissionModule
  requiredFeature?: PlanFeature
}

export function buildAdminNav(locale: AppLocale, tenantSlug: string): AdminNavItem[] {
  return [
    { key: "dashboard", href: adminAppPath({ locale, tenantSlug, path: "/dashboard" }), module: "bookings" },
    { key: "calendar", href: adminAppPath({ locale, tenantSlug, path: "/calendar" }), module: "calendar" },
    { key: "bookings", href: adminAppPath({ locale, tenantSlug, path: "/bookings" }), module: "bookings" },
    { key: "customers", href: adminAppPath({ locale, tenantSlug, path: "/customers" }), module: "customers" },
    { key: "services", href: adminAppPath({ locale, tenantSlug, path: "/services" }), module: "services" },
    { key: "staff", href: adminAppPath({ locale, tenantSlug, path: "/staff" }), module: "staff" },
    { key: "waitlist", href: adminAppPath({ locale, tenantSlug, path: "/waitlist" }), module: "bookings" },
    {
      key: "notifications",
      href: adminAppPath({ locale, tenantSlug, path: "/notifications" }),
      module: "notifications",
      requiredFeature: PLAN_FEATURES.NOTIFICATIONS,
    },
    {
      key: "loyalty",
      href: adminAppPath({ locale, tenantSlug, path: "/loyalty" }),
      module: "bookings",
      requiredFeature: PLAN_FEATURES.LOYALTY,
    },
    {
      key: "vouchers",
      href: adminAppPath({ locale, tenantSlug, path: "/vouchers" }),
      module: "bookings",
      requiredFeature: PLAN_FEATURES.VOUCHERS,
    },
    {
      key: "reviews",
      href: adminAppPath({ locale, tenantSlug, path: "/reviews" }),
      module: "bookings",
      requiredFeature: PLAN_FEATURES.REVIEWS,
    },
    {
      key: "analytics",
      href: adminAppPath({ locale, tenantSlug, path: "/analytics" }),
      module: "bookings",
      requiredFeature: PLAN_FEATURES.ANALYTICS,
    },
    { key: "embed", href: adminAppPath({ locale, tenantSlug, path: "/embed" }), module: "bookings" },
    { key: "settings", href: adminAppPath({ locale, tenantSlug, path: "/tenant-settings" }), module: "tenantSettings" },
  ]
}
