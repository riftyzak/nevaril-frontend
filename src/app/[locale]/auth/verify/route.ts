import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

import type { AppLocale } from "@/i18n/locales"
import { getAuthAdapter } from "@/lib/auth/adapter"
import { getAuthSource } from "@/lib/auth/source"
import {
  AUTH_SESSION_COOKIE_NAME,
  AUTH_SESSION_MAX_AGE_SECONDS,
} from "@/lib/auth/session-cookie"
import { adminAppPath, localePath } from "@/lib/tenant/tenant-url"

function resolveNextPath(locale: AppLocale, tenantSlug?: string, next?: string) {
  if (next && next.startsWith("/")) {
    return next
  }

  if (tenantSlug) {
    return adminAppPath({ locale, tenantSlug })
  }

  return localePath({ locale, path: "/" })
}

function buildVerifyErrorPath(input: {
  locale: AppLocale
  code: "verify-invalid" | "verify-disabled"
  tenantSlug?: string
  next?: string
}) {
  const params = new URLSearchParams({ code: input.code })

  if (input.tenantSlug) {
    params.set("tenantSlug", input.tenantSlug)
  }

  if (input.next) {
    params.set("next", input.next)
  }

  return `${localePath({ locale: input.locale, path: "/auth/verify/error" })}?${params.toString()}`
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ locale: string }> }
) {
  const { locale: localeParam } = await context.params
  const locale = localeParam as AppLocale
  const url = new URL(request.url)
  const token = url.searchParams.get("token")?.trim() ?? ""
  const tenantSlug = url.searchParams.get("tenantSlug")?.trim() || undefined
  const next = url.searchParams.get("next")?.trim() || undefined

  if (getAuthSource() !== "convex") {
    return NextResponse.redirect(
      new URL(
        buildVerifyErrorPath({
          locale,
          code: "verify-disabled",
          tenantSlug,
          next,
        }),
        url
      )
    )
  }

  if (!token) {
    return NextResponse.redirect(
      new URL(
        buildVerifyErrorPath({
          locale,
          code: "verify-invalid",
          tenantSlug,
          next,
        }),
        url
      )
    )
  }

  try {
    const result = await getAuthAdapter().completeMagicLink({ token })
    const cookieStore = await cookies()

    cookieStore.set(AUTH_SESSION_COOKIE_NAME, result.sessionToken, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: AUTH_SESSION_MAX_AGE_SECONDS,
    })

    return NextResponse.redirect(
      new URL(resolveNextPath(locale, tenantSlug, next), url)
    )
  } catch {
    return NextResponse.redirect(
      new URL(
        buildVerifyErrorPath({
          locale,
          code: "verify-invalid",
          tenantSlug,
          next,
        }),
        url
      )
    )
  }
}
