import type { AppLocale } from "@/i18n/locales"
import type { PermissionModule } from "@/lib/auth/types"
import { adminAppPath } from "@/lib/tenant/tenant-url"

export interface AdminNavItem {
  key: "dashboard" | "calendar" | "bookings" | "customers" | "services" | "staff" | "waitlist" | "settings"
  href: string
  module: PermissionModule
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
    { key: "settings", href: adminAppPath({ locale, tenantSlug, path: "/tenant-settings" }), module: "tenantSettings" },
  ]
}
