import {
  APP_LOCALES,
  DEFAULT_LOCALE as APP_DEFAULT_LOCALE,
  isAppLocale,
  type AppLocale,
} from "@/i18n/locales"

export const SUPPORTED_LOCALES = APP_LOCALES

export type Locale = AppLocale
export type TenantRoutingMode = "subdomain" | "path" | "hybrid"
export type TenantSource = "subdomain" | "path" | null

export interface TenantResolution {
  locale: Locale | null
  tenantSlug: string | null
  source: TenantSource
}

interface ResolveTenantInput {
  host?: string | null
  pathname: string
  mode: TenantRoutingMode
}

export const DEFAULT_LOCALE: Locale = APP_DEFAULT_LOCALE

function normalizeHost(host?: string | null) {
  if (!host) return null
  return host.split(":")[0].toLowerCase()
}

function getPathSegments(pathname: string) {
  return pathname.split("/").filter(Boolean)
}

export function isSupportedLocale(value: string): value is Locale {
  return isAppLocale(value)
}

export function getRoutingMode(): TenantRoutingMode {
  const mode = process.env.NEXT_PUBLIC_TENANT_ROUTING_MODE
  if (mode === "subdomain" || mode === "path" || mode === "hybrid") {
    return mode
  }
  return "hybrid"
}

export function hasLocalePrefix(pathname: string) {
  const segments = getPathSegments(pathname)
  return Boolean(segments[0] && isSupportedLocale(segments[0]))
}

export function getLocaleFromPath(pathname: string): Locale | null {
  const segments = getPathSegments(pathname)
  if (segments[0] && isSupportedLocale(segments[0])) {
    return segments[0]
  }
  return null
}

export function getTenantFromPath(pathname: string): string | null {
  const segments = getPathSegments(pathname)
  if (segments.length >= 3 && isSupportedLocale(segments[0]) && segments[1] === "t") {
    return decodeURIComponent(segments[2])
  }
  return null
}

export function stripLocalePrefix(pathname: string): string {
  const segments = getPathSegments(pathname)
  if (segments[0] && isSupportedLocale(segments[0])) {
    const remaining = segments.slice(1)
    return remaining.length ? `/${remaining.join("/")}` : "/"
  }
  return pathname
}

export function stripTenantPrefix(pathname: string): string {
  const segments = getPathSegments(pathname)
  if (segments.length >= 3 && isSupportedLocale(segments[0]) && segments[1] === "t") {
    const remaining = segments.slice(3)
    return remaining.length ? `/${remaining.join("/")}` : "/"
  }
  return stripLocalePrefix(pathname)
}

export function getTenantFromHost(host?: string | null): string | null {
  const normalized = normalizeHost(host)
  if (!normalized || normalized === "localhost") return null
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(normalized)) return null

  if (normalized.endsWith(".localhost")) {
    const labels = normalized.split(".")
    if (labels.length >= 2) {
      return labels[0] === "www" ? null : labels[0]
    }
  }

  const labels = normalized.split(".")
  if (labels.length < 3) return null
  return labels[0] === "www" ? null : labels[0]
}

export function resolveTenant(input: ResolveTenantInput): TenantResolution {
  const locale = getLocaleFromPath(input.pathname)
  const pathTenant = getTenantFromPath(input.pathname)
  const subdomainTenant = getTenantFromHost(input.host)

  if (input.mode === "subdomain") {
    return {
      locale,
      tenantSlug: subdomainTenant,
      source: subdomainTenant ? "subdomain" : null,
    }
  }

  if (input.mode === "path") {
    return {
      locale,
      tenantSlug: pathTenant,
      source: pathTenant ? "path" : null,
    }
  }

  if (subdomainTenant) {
    return {
      locale,
      tenantSlug: subdomainTenant,
      source: "subdomain",
    }
  }

  return {
    locale,
    tenantSlug: pathTenant,
    source: pathTenant ? "path" : null,
  }
}
