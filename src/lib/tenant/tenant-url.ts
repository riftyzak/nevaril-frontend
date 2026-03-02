import { type Locale } from "@/lib/tenant/resolveTenant"

interface TenantPathInput {
  locale: Locale
  tenantSlug: string
  path?: string
}

interface LocalizedPathInput {
  locale: Locale
  path?: string
}

interface AdminAppInput {
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

export function localePath({ locale, path }: LocalizedPathInput) {
  return `/${locale}${normalizePath(path)}`
}

export function adminAppPath({ locale, tenantSlug, path }: AdminAppInput) {
  return localePath({
    locale,
    path: `/app/${tenantSlug}${normalizePath(path)}`,
  })
}

export function tenantUrl(input: TenantPathInput) {
  // Canonical internal links always use path form in MVP.
  return tenantPath(input)
}

export function tenantPathToSubdomainPath(pathname: string) {
  const segments = pathname.split("/").filter(Boolean)
  if (segments.length < 3 || segments[1] !== "t") {
    return pathname
  }

  const locale = segments[0]
  const rest = segments.slice(3)
  return rest.length ? `/${locale}/${rest.join("/")}` : `/${locale}`
}
