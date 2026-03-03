import { type Locale } from "@/lib/tenant/resolveTenant"
import { type TenantSource } from "@/lib/tenant/resolveTenant"

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

function ensureTenantHost(host: string, tenantSlug: string) {
  const [hostname, port] = host.split(":")
  if (!hostname) return host

  if (hostname === "localhost") {
    return `${tenantSlug}.localhost${port ? `:${port}` : ""}`
  }

  const labels = hostname.split(".")
  if (labels[0] !== tenantSlug) {
    labels.unshift(tenantSlug)
  }
  return `${labels.join(".")}${port ? `:${port}` : ""}`
}

export function publicTenantAbsoluteUrl(input: {
  locale: Locale
  tenantSlug: string
  path?: string
  source?: TenantSource | "path" | "subdomain"
  host: string
  protocol?: "http" | "https"
}) {
  const protocol = input.protocol ?? "http"
  const canonicalPath = tenantPath({
    locale: input.locale,
    tenantSlug: input.tenantSlug,
    path: input.path,
  })

  if (input.source === "subdomain") {
    const subdomainPath = tenantPathToSubdomainPath(canonicalPath)
    return `${protocol}://${ensureTenantHost(input.host, input.tenantSlug)}${subdomainPath}`
  }

  return `${protocol}://${input.host}${canonicalPath}`
}
