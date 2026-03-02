import Link from "next/link"
import { getTranslations } from "next-intl/server"

import { type AppLocale } from "@/i18n/locales"

export default async function NotAuthorizedPage({
  params,
}: Readonly<{
  params: Promise<{ locale: AppLocale }>
}>) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "adminAuth" })

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl items-center px-4">
      <section className="w-full rounded-xl border border-border bg-card p-6">
        <h1 className="text-xl font-semibold">{t("title")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("description")}</p>
        <Link
          href={`/${locale}`}
          className="mt-5 inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          {t("backHome")}
        </Link>
      </section>
    </main>
  )
}
