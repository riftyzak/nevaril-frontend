import { NextResponse, type NextRequest } from "next/server"

import {
  DEFAULT_LOCALE,
  getLocaleFromPath,
  getRoutingMode,
  hasLocalePrefix,
  resolveTenant,
  stripLocalePrefix,
  stripTenantPrefix,
} from "@/lib/tenant/resolveTenant"
import { tenantPath } from "@/lib/tenant/tenant-url"

function withTenantHeaders(
  request: NextRequest,
  tenantSlug: string | null,
  source: "subdomain" | "path" | null
) {
  const requestHeaders = new Headers(request.headers)
  if (tenantSlug) requestHeaders.set("x-tenant-slug", tenantSlug)
  if (source) requestHeaders.set("x-tenant-source", source)
  return requestHeaders
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const mode = getRoutingMode()

  if (!hasLocalePrefix(pathname)) {
    const target = request.nextUrl.clone()
    target.pathname = `/${DEFAULT_LOCALE}${pathname === "/" ? "" : pathname}`
    return NextResponse.redirect(target)
  }

  const resolution = resolveTenant({
    host: request.headers.get("host"),
    pathname,
    mode,
  })
  const locale = getLocaleFromPath(pathname) ?? DEFAULT_LOCALE

  if (resolution.source === "subdomain" && resolution.tenantSlug) {
    const remainder = pathname.includes("/t/")
      ? stripTenantPrefix(pathname)
      : stripLocalePrefix(pathname)
    const isManagePath = remainder === "/m" || remainder.startsWith("/m/")

    if (isManagePath) {
      return NextResponse.next({
        request: {
          headers: withTenantHeaders(request, resolution.tenantSlug, resolution.source),
        },
      })
    }

    const target = request.nextUrl.clone()

    target.pathname = tenantPath({
      locale,
      tenantSlug: resolution.tenantSlug,
      path: remainder,
    })
    target.search = search

    return NextResponse.rewrite(target, {
      request: {
        headers: withTenantHeaders(request, resolution.tenantSlug, resolution.source),
      },
    })
  }

  return NextResponse.next({
    request: {
      headers: withTenantHeaders(request, resolution.tenantSlug, resolution.source),
    },
  })
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
}
