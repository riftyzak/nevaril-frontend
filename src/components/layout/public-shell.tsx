import Link from "next/link"
import type { CSSProperties, ReactNode } from "react"
import { getTranslations } from "next-intl/server"

import { DevMenu } from "@/components/dev/dev-menu"
import { LocaleSwitcher } from "@/components/locale-switcher"
import { ThemeToggle } from "@/components/theme-toggle"
import { type AppLocale } from "@/i18n/locales"
import type { WidgetThemeOverrides } from "@/lib/theme/widget-theme"

async function LogoPlaceholder({
  locale,
  logoUrl,
}: Readonly<{ locale: AppLocale; logoUrl?: string }>) {
  const t = await getTranslations({ locale, namespace: "shell.public" })
  return (
    <div className="flex items-center gap-3">
      {logoUrl ? (
        <img src={logoUrl} alt={t("brandName")} className="size-8 rounded-lg object-cover ring-1 ring-border" />
      ) : (
        <div className="size-8 rounded-lg bg-primary/20 ring-1 ring-border" />
      )}
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
  widgetMode = false,
  themeOverrides,
}: Readonly<{
  children: ReactNode
  homeHref: string
  locale: AppLocale
  widgetMode?: boolean
  themeOverrides?: WidgetThemeOverrides
}>) {
  const t = await getTranslations({ locale, namespace: "shell.public" })

  return (
    <div
      className="min-h-screen bg-background text-foreground"
      style={
        {
          "--primary": themeOverrides?.primary ?? undefined,
          "--radius": themeOverrides?.radius ?? undefined,
        } as CSSProperties
      }
    >
      <header className={`border-b border-border ${widgetMode ? "border-b-0" : ""}`}>
        <div
          className={`mx-auto flex w-full items-center justify-between gap-4 ${
            widgetMode ? "max-w-none px-3 py-2" : "max-w-6xl px-4 py-3 sm:px-6"
          }`}
        >
          <Link href={homeHref} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-lg">
            <LogoPlaceholder locale={locale} logoUrl={themeOverrides?.logoUrl} />
          </Link>
          {!widgetMode ? (
            <div className="flex items-center gap-2">
              <LocaleSwitcher />
              <ThemeToggle />
            </div>
          ) : null}
        </div>
      </header>
      <main className={`mx-auto w-full ${widgetMode ? "max-w-none px-3 py-3" : "max-w-6xl px-4 py-6 sm:px-6"}`}>{children}</main>
      {!widgetMode ? (
        <footer className="border-t border-border">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 text-xs text-muted-foreground sm:px-6">
            <span>{t("footerTitle")}</span>
            <span>{t("footerNote")}</span>
          </div>
        </footer>
      ) : null}
      <DevMenu />
    </div>
  )
}
