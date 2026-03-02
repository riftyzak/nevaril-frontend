import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { notFound } from "next/navigation"

import { isAppLocale, type AppLocale } from "@/i18n/locales"
import { tenantUrl } from "@/lib/tenant/tenant-url"

export default async function LocaleHomePage({
  params,
}: Readonly<{
  params: Promise<{ locale: string }>
}>) {
  const { locale } = await params
  if (!isAppLocale(locale)) {
    notFound()
  }
  const typedLocale = locale as AppLocale
  const t = await getTranslations({ locale: typedLocale, namespace: "landing" })

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center gap-8 px-4 sm:px-6">
      <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        <p className="text-sm text-muted-foreground">{t("eyebrow")}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          {t("title")}
        </h1>
        <p className="mt-3 text-muted-foreground">{t("description")}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={tenantUrl({ locale: typedLocale, tenantSlug: "barber", path: "/public" })}
            className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {t("barberPublic")}
          </Link>
          <Link
            href={tenantUrl({ locale: typedLocale, tenantSlug: "barber", path: "/admin" })}
            className="rounded-full border border-border bg-background px-5 py-2 text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {t("barberAdmin")}
          </Link>
        </div>
      </section>
    </main>
  )
}
