import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { notFound } from "next/navigation"

import { isAppLocale, type AppLocale } from "@/i18n/locales"
import { adminAppPath, tenantUrl } from "@/lib/tenant/tenant-url"

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
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center gap-8 px-4 py-8 sm:px-6">
      <section className="rounded-2xl border border-border bg-card p-6 sm:p-10">
        <p className="text-sm font-medium text-primary">{t("eyebrow")}</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">{t("description")}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={tenantUrl({ locale: typedLocale, tenantSlug: "barber", path: "/book" })}
            className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {t("ctaBook")}
          </Link>
          <Link
            href={adminAppPath({ locale: typedLocale, tenantSlug: "barber", path: "/dashboard" })}
            className="rounded-full border border-border bg-background px-5 py-2 text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {t("ctaSignIn")}
          </Link>
        </div>
        <Link
          href={`/${typedLocale}/pricing`}
          className="mt-6 inline-block text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          {t("pricingTeaser")}
        </Link>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <article className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">{t("feature1Title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("feature1Body")}</p>
        </article>
        <article className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">{t("feature2Title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("feature2Body")}</p>
        </article>
        <article className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">{t("feature3Title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("feature3Body")}</p>
        </article>
        <article className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">{t("feature4Title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("feature4Body")}</p>
        </article>
      </section>
      <section className="rounded-xl border border-border bg-card p-4">
        <p className="text-sm text-muted-foreground">{t("trustLine")}</p>
      </section>
    </main>
  )
}
