import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import { revokeConvexSession } from "@/lib/auth/convex-auth-client"
import { getAuthSource } from "@/lib/auth/source"
import { AUTH_SESSION_COOKIE_NAME } from "@/lib/auth/session-cookie"

export async function GET(
  request: Request,
  context: { params: Promise<{ locale: string }> }
) {
  const { locale } = await context.params
  const url = new URL(request.url)
  const next = url.searchParams.get("next")
  const redirectTo =
    next && next.startsWith("/") ? next : `/${encodeURIComponent(locale)}/auth/sign-in`

  if (getAuthSource() === "convex") {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get(AUTH_SESSION_COOKIE_NAME)?.value ?? null

    if (sessionToken) {
      await revokeConvexSession(sessionToken)
    }

    cookieStore.delete(AUTH_SESSION_COOKIE_NAME)
  }

  return NextResponse.redirect(new URL(redirectTo, url))
}
