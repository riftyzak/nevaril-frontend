import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { AppLocale } from "@/i18n/locales"
import { localePath } from "@/lib/tenant/tenant-url"

interface VerifyErrorSearchParams {
  code?: string
  tenantSlug?: string
  next?: string
}

function buildRetryPath(input: {
  locale: AppLocale
  tenantSlug?: string
  next?: string
}) {
  const params = new URLSearchParams()

  if (input.tenantSlug) {
    params.set("tenantSlug", input.tenantSlug)
  }

  if (input.next) {
    params.set("next", input.next)
  }

  const basePath = localePath({ locale: input.locale, path: "/auth/sign-in" })
  const search = params.toString()
  return search ? `${basePath}?${search}` : basePath
}

function getVerifyErrorCopy(code?: string) {
  if (code === "verify-disabled") {
    return {
      title: "Backend auth handoff is disabled",
      description:
        "This verification link only works when AUTH_SOURCE=convex is enabled.",
    }
  }

  return {
    title: "Magic link is no longer valid",
    description:
      "The verification link is missing, expired, or has already been used. Request a fresh magic link and try again.",
  }
}

export default async function AuthVerifyErrorPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ locale: AppLocale }>
  searchParams: Promise<VerifyErrorSearchParams>
}>) {
  const { locale } = await params
  const { code, tenantSlug, next } = await searchParams
  const copy = getVerifyErrorCopy(code)
  const retryPath = buildRetryPath({ locale, tenantSlug, next })

  return (
    <main className="mx-auto flex min-h-screen max-w-xl items-center px-4 py-8">
      <Card className="w-full" data-testid="auth-verify-error">
        <CardHeader>
          <CardTitle>{copy.title}</CardTitle>
          <CardDescription>{copy.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href={retryPath}>Request a new link</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
