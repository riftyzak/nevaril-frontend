import Link from "next/link"
import type { ReactNode } from "react"
import { getTranslations } from "next-intl/server"

import { LocaleSwitcher } from "@/components/locale-switcher"
import { ThemeToggle } from "@/components/theme-toggle"
import { type AppLocale } from "@/i18n/locales"

async function LogoPlaceholder({ locale }: Readonly<{ locale: AppLocale }>) {
  const t = await getTranslations({ locale, namespace: "shell.public" })
  return (
    <div className="flex items-center gap-3">
      <div className="size-8 rounded-lg bg-primary/20 ring-1 ring-border" />
      <div>
        <p className="text-sm font-semibold">{t("brandName")}</p>
        <p className="text-xs text-muted-foreground">{t("logoPlaceholder")}</p>
      </div>
    </div>
  )
}

export async function PublicShell({
  children,
  homeHref,
  locale,
}: Readonly<{
  children: ReactNode
  homeHref: string
  locale: AppLocale
}>) {
  const t = await getTranslations({ locale, namespace: "shell.public" })

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href={homeHref} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-lg">
            <LogoPlaceholder locale={locale} />
          </Link>
          <div className="flex items-center gap-2">
            <LocaleSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">{children}</main>
      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 text-xs text-muted-foreground sm:px-6">
          <span>{t("footerTitle")}</span>
          <span>{t("footerNote")}</span>
        </div>
      </footer>
    </div>
  )
}
