import Link from "next/link"
import type { CSSProperties, ReactNode } from "react"
import { getTranslations } from "next-intl/server"

import { DevMenu } from "@/components/dev/dev-menu"
import { PublicBrand } from "@/components/layout/public-brand"
import { LocaleSwitcher } from "@/components/locale-switcher"
import { ThemeToggle } from "@/components/theme-toggle"
import { type AppLocale } from "@/i18n/locales"
import type { WidgetThemeOverrides } from "@/lib/theme/widget-theme"

export async function PublicShell({
  children,
  homeHref,
  locale,
  tenantSlug,
  brandName,
  widgetMode = false,
  themeOverrides,
}: Readonly<{
  children: ReactNode
  homeHref: string
  locale: AppLocale
  tenantSlug?: string
  brandName?: string
  widgetMode?: boolean
  themeOverrides?: WidgetThemeOverrides
}>) {
  const t = await getTranslations({ locale, namespace: "shell.public" })
  const effectiveBrandName = brandName ?? t("brandName")

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
      <header className={`${widgetMode ? "" : "border-b border-border"}`}>
        <div
          className={`mx-auto flex w-full items-center justify-between gap-4 ${
            widgetMode ? "max-w-none px-3 py-2" : "max-w-6xl px-4 py-2.5 sm:px-6"
          }`}
        >
          <Link
            href={homeHref}
            className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <PublicBrand
              tenantSlug={tenantSlug}
              brandNameFallback={effectiveBrandName}
              logoUrlOverride={themeOverrides?.logoUrl}
              compact={widgetMode}
            />
          </Link>
          {widgetMode ? null : (
            <div className="flex items-center gap-2 rounded-full border border-border bg-card px-2 py-1">
              <LocaleSwitcher />
              <ThemeToggle />
            </div>
          )}
        </div>
      </header>
      <main className={`mx-auto w-full ${widgetMode ? "max-w-none px-3 py-3" : "max-w-6xl px-4 py-6 sm:px-6"}`}>{children}</main>
      {!widgetMode ? <DevMenu /> : null}
    </div>
  )
}
