import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getAuthAdapter } from "@/lib/auth/adapter"
import { getAuthSource } from "@/lib/auth/source"
import type { AppLocale } from "@/i18n/locales"
import { adminAppPath, localePath } from "@/lib/tenant/tenant-url"

interface SignInSearchParams {
  tenantSlug?: string
  next?: string
  requested?: string
  email?: string
  expiresAt?: string
  cooldownEndsAt?: string
  deliveryMode?: string
  error?: string
}

function resolveNextPath(locale: AppLocale, tenantSlug?: string, next?: string) {
  if (next && next.startsWith("/")) {
    return next
  }

  if (tenantSlug) {
    return adminAppPath({ locale, tenantSlug })
  }

  return localePath({ locale, path: "/" })
}

function buildLocalizedPath(input: {
  locale: AppLocale
  path: string
  query?: Record<string, string | undefined>
}) {
  const basePath = localePath({ locale: input.locale, path: input.path })
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(input.query ?? {})) {
    if (value) {
      params.set(key, value)
    }
  }

  const search = params.toString()
  return search ? `${basePath}?${search}` : basePath
}

function buildSignInPath(input: {
  locale: AppLocale
  tenantSlug?: string
  next?: string
  requested?: string
  email?: string
  expiresAt?: string
  cooldownEndsAt?: string
  deliveryMode?: string
  error?: string
}) {
  return buildLocalizedPath({
    locale: input.locale,
    path: "/auth/sign-in",
    query: {
      tenantSlug: input.tenantSlug,
      next: input.next,
      requested: input.requested,
      email: input.email,
      expiresAt: input.expiresAt,
      cooldownEndsAt: input.cooldownEndsAt,
      deliveryMode: input.deliveryMode,
      error: input.error,
    },
  })
}

function getErrorCopy(errorCode?: string) {
  switch (errorCode) {
    case "invalid-email":
      return {
        title: "Enter a valid email",
        description: "Magic-link sign-in needs a valid email address.",
      }
    case "request-failed":
      return {
        title: "Could not create sign-in link",
        description: "We could not send a sign-in email for this request. Check the address or try again shortly.",
      }
    case "verify-invalid":
      return {
        title: "Magic link is no longer valid",
        description: "The link is missing, expired, or has already been used. Request a fresh link and try again.",
      }
    case "verify-disabled":
      return {
        title: "Backend auth handoff is disabled",
        description: "This verification link only works when AUTH_SOURCE=convex.",
      }
    default:
      return null
  }
}

function getDeliveryCopy(deliveryMode?: string) {
  if (deliveryMode === "email_cooldown") {
    return {
      title: "Email already sent",
      description: "A recent sign-in email is still active. Wait for the cooldown window to pass before requesting another link.",
    }
  }

  return {
    title: "Check your email",
    description: "If the address is eligible for Convex auth, a sign-in link has been sent.",
  }
}

async function getRequestOrigin() {
  const headerStore = await headers()
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host")
  const protocol = headerStore.get("x-forwarded-proto") ?? "http"

  if (!host) {
    throw new Error("The current request host could not be resolved for magic-link delivery.")
  }

  return `${protocol}://${host}`
}

export default async function AuthSignInPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ locale: AppLocale }>
  searchParams: Promise<SignInSearchParams>
}>) {
  const { locale } = await params
  const {
    tenantSlug,
    next,
    requested,
    email,
    expiresAt,
    cooldownEndsAt,
    deliveryMode,
    error,
  } = await searchParams
  const authSource = getAuthSource()
  const nextPath = resolveNextPath(locale, tenantSlug, next)
  const errorCopy = getErrorCopy(error)
  const deliveryCopy = requested === "1" ? getDeliveryCopy(deliveryMode) : null

  async function requestMagicLink(formData: FormData) {
    "use server"

    const formEmail = String(formData.get("email") ?? "").trim().toLowerCase()
    const requestedTenantSlug = String(formData.get("tenantSlug") ?? "").trim() || undefined
    const requestedNext = String(formData.get("next") ?? "").trim() || undefined
    const redirectTo = resolveNextPath(locale, requestedTenantSlug, requestedNext)

    if (!formEmail || !formEmail.includes("@")) {
      redirect(
        buildSignInPath({
          locale,
          tenantSlug: requestedTenantSlug,
          next: redirectTo,
          email: formEmail,
          error: "invalid-email",
        })
      )
    }

    try {
      const origin = await getRequestOrigin()
      const result = await getAuthAdapter().beginMagicLink({
        email: formEmail,
        tenantSlug: requestedTenantSlug,
        locale,
        next: redirectTo,
        origin,
      })

      redirect(
        buildSignInPath({
          locale,
          tenantSlug: requestedTenantSlug,
          next: redirectTo,
          requested: "1",
          email: formEmail,
          expiresAt: result.expiresAt,
          cooldownEndsAt: result.cooldownEndsAt,
          deliveryMode: result.deliveryMode,
        })
      )
    } catch {
      redirect(
        buildSignInPath({
          locale,
          tenantSlug: requestedTenantSlug,
          next: redirectTo,
          email: formEmail,
          error: "request-failed",
        })
      )
    }
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
          <CardTitle>Email sign-in</CardTitle>
          <CardDescription>
            Request a Convex-backed magic link for an existing account. M29 sends the verification link by email instead of exposing it in the UI.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {errorCopy ? (
            <div
              data-testid="auth-error-card"
              className="rounded-lg border border-destructive/30 bg-destructive/5 p-3"
            >
              <p className="text-sm font-medium">{errorCopy.title}</p>
              <p className="text-xs text-muted-foreground">{errorCopy.description}</p>
            </div>
          ) : null}

          {requested === "1" && deliveryCopy ? (
            <div
              data-testid="auth-requested-card"
              className="grid gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-emerald-950"
            >
              <div>
                <p className="text-sm font-medium">{deliveryCopy.title}</p>
                <p className="text-xs text-emerald-900/80">
                  {email ? `Requested for ${email}. ` : ""}
                  {deliveryCopy.description}
                </p>
                {expiresAt ? (
                  <p className="text-xs text-emerald-900/80">Expires at {expiresAt}</p>
                ) : null}
                {cooldownEndsAt ? (
                  <p className="text-xs text-emerald-900/80">You can request another link after {cooldownEndsAt}</p>
                ) : null}
              </div>
            </div>
          ) : null}

          <form
            action={requestMagicLink}
            className="grid gap-3"
            data-testid="auth-sign-in-form"
          >
            <input type="hidden" name="tenantSlug" value={tenantSlug ?? ""} />
            <input type="hidden" name="next" value={nextPath} />
            <div className="grid gap-2">
              <Label htmlFor="auth-email">Email</Label>
              <Input
                id="auth-email"
                name="email"
                type="email"
                defaultValue={email ?? ""}
                autoComplete="email"
                data-testid="auth-email"
                required
              />
            </div>
            <Button type="submit" className="justify-self-start" data-testid="auth-request-submit">
              Request magic link
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
