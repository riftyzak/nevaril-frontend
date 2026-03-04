import { NextResponse, type NextRequest } from "next/server"

import {
  DEFAULT_LOCALE,
  getLocaleFromPath,
  getRoutingMode,
  hasLocalePrefix,
  isSupportedLocale,
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

function getPathPublicRedirect(pathname: string) {
  const segments = pathname.split("/").filter(Boolean)
  if (
    segments.length >= 4 &&
    isSupportedLocale(segments[0]) &&
    segments[1] === "t" &&
    segments[3] === "public"
  ) {
    const locale = segments[0]
    const tenantSlug = segments[2]
    const remainder = segments.slice(4)

    return tenantPath({
      locale,
      tenantSlug,
      path: `/book${remainder.length ? `/${remainder.join("/")}` : ""}`,
    })
  }

  return null
}

export function proxy(request: NextRequest) {
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
  const pathPublicRedirect = getPathPublicRedirect(pathname)
  if (pathPublicRedirect) {
    const target = request.nextUrl.clone()
    target.pathname = pathPublicRedirect
    target.search = search
    return NextResponse.redirect(target, 301)
  }

  if (resolution.source === "subdomain" && resolution.tenantSlug) {
    const remainder = pathname.includes("/t/")
      ? stripTenantPrefix(pathname)
      : stripLocalePrefix(pathname)
    const isManagePath = remainder === "/m" || remainder.startsWith("/m/")
    const isAdminAppPath = remainder === "/app" || remainder.startsWith("/app/")

    if (isManagePath || isAdminAppPath) {
      return NextResponse.next({
        request: {
          headers: withTenantHeaders(request, resolution.tenantSlug, resolution.source),
        },
      })
    }

    if (remainder === "/public" || remainder.startsWith("/public/")) {
      const target = request.nextUrl.clone()
      const remainderSuffix = remainder === "/public" ? "" : remainder.slice("/public".length)

      target.pathname = tenantPath({
        locale,
        tenantSlug: resolution.tenantSlug,
        path: `/book${remainderSuffix}`,
      })
      target.search = search
      return NextResponse.redirect(target, 301)
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
