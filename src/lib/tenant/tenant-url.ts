import { type Locale } from "@/lib/tenant/resolveTenant"

interface TenantPathInput {
  locale: Locale
  tenantSlug: string
  path?: string
}

function normalizePath(path?: string) {
  if (!path || path === "/") return ""
  return path.startsWith("/") ? path : `/${path}`
}

export function tenantPath({ locale, tenantSlug, path }: TenantPathInput) {
  return `/${locale}/t/${tenantSlug}${normalizePath(path)}`
}

export function tenantUrl(input: TenantPathInput) {
  // Canonical internal links always use path form in MVP.
  return tenantPath(input)
}
