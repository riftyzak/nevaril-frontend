import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createConvexSeededSession } from "@/lib/auth/convex-auth-client"
import { getAuthSource } from "@/lib/auth/source"
import {
  AUTH_SESSION_COOKIE_NAME,
  AUTH_SESSION_MAX_AGE_SECONDS,
} from "@/lib/auth/session-cookie"
import type { AppLocale } from "@/i18n/locales"
import { adminAppPath, localePath } from "@/lib/tenant/tenant-url"

const SEEDED_IDENTITIES = [
  {
    email: "martin.novak@barber.test",
    label: "Owner",
    description: "Martin Novak, owner membership for barber",
  },
  {
    email: "tomas.kral@barber.test",
    label: "Staff",
    description: "Tomas Kral, staff membership for barber",
  },
] as const

function resolveNextPath(locale: AppLocale, tenantSlug?: string, next?: string) {
  if (next && next.startsWith("/")) {
    return next
  }

  if (tenantSlug) {
    return adminAppPath({ locale, tenantSlug })
  }

  return localePath({ locale, path: "/" })
}

export default async function AuthSignInPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ locale: AppLocale }>
  searchParams: Promise<{ tenantSlug?: string; next?: string }>
}>) {
  const { locale } = await params
  const { tenantSlug, next } = await searchParams
  const authSource = getAuthSource()
  const nextPath = resolveNextPath(locale, tenantSlug, next)

  async function signInAsSeededUser(formData: FormData) {
    "use server"

    const email = String(formData.get("email") ?? "").trim().toLowerCase()
    const requestedTenantSlug = String(formData.get("tenantSlug") ?? "").trim() || undefined
    const redirectTo = resolveNextPath(
      locale,
      requestedTenantSlug,
      String(formData.get("next") ?? "").trim() || undefined
    )
    const result = await createConvexSeededSession({
      email,
      tenantSlug: requestedTenantSlug,
    })

    const cookieStore = await cookies()
    cookieStore.set(AUTH_SESSION_COOKIE_NAME, result.sessionToken, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: AUTH_SESSION_MAX_AGE_SECONDS,
    })

    redirect(redirectTo)
  }

  if (authSource !== "convex") {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl items-center px-4 py-8">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Backend auth handoff is disabled</CardTitle>
            <CardDescription>
              This page is only active when `AUTH_SOURCE=convex`. Mock auth remains available as an explicit fallback/dev mode.
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
    )
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-xl items-center px-4 py-8">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Seeded backend sign-in</CardTitle>
          <CardDescription>
            Minimal M27 handoff for Convex-backed sessions. Choose one seeded identity and continue into the existing app flow.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {SEEDED_IDENTITIES.map((identity) => (
            <form key={identity.email} action={signInAsSeededUser} className="grid gap-2 rounded-lg border border-border p-3">
              <input type="hidden" name="email" value={identity.email} />
              <input type="hidden" name="tenantSlug" value={tenantSlug ?? ""} />
              <input type="hidden" name="next" value={nextPath} />
              <div>
                <p className="text-sm font-medium">{identity.label}</p>
                <p className="text-xs text-muted-foreground">{identity.description}</p>
                <p className="text-xs text-muted-foreground">{identity.email}</p>
              </div>
              <Button type="submit" className="justify-self-start">
                Continue as {identity.label.toLowerCase()}
              </Button>
            </form>
          ))}
        </CardContent>
      </Card>
    </main>
  )
}
