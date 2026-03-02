import Link from "next/link"
import { notFound } from "next/navigation"

import { isSupportedLocale } from "@/lib/tenant/resolveTenant"
import { tenantUrl } from "@/lib/tenant/tenant-url"

export default async function LocaleHomePage({
  params,
}: Readonly<{
  params: Promise<{ locale: string }>
}>) {
  const { locale } = await params
  if (!isSupportedLocale(locale)) {
    notFound()
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center gap-8 px-4 sm:px-6">
      <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        <p className="text-sm text-muted-foreground">Milestone 2</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Tenant-aware routing baseline
        </h1>
        <p className="mt-3 text-muted-foreground">
          Pick a tenant demo route. Internal links use tenant URL helpers.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={tenantUrl({ locale, tenantSlug: "barber", path: "/public" })}
            className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Barber public demo
          </Link>
          <Link
            href={tenantUrl({ locale, tenantSlug: "barber", path: "/admin" })}
            className="rounded-full border border-border bg-background px-5 py-2 text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Barber admin demo
          </Link>
        </div>
      </section>
    </main>
  )
}
