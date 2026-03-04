import Link from "next/link"
import Image from "next/image"
import type { CSSProperties, ReactNode } from "react"
import { getTranslations } from "next-intl/server"

import { DevMenu } from "@/components/dev/dev-menu"
import { LocaleSwitcher } from "@/components/locale-switcher"
import { ThemeToggle } from "@/components/theme-toggle"
import { type AppLocale } from "@/i18n/locales"
import type { WidgetThemeOverrides } from "@/lib/theme/widget-theme"

function BrandMark({
  brandName,
  logoUrl,
  compact = false,
}: Readonly<{ brandName: string; logoUrl?: string; compact?: boolean }>) {
  return (
    <div className="flex items-center gap-2">
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt={brandName}
          width={compact ? 28 : 32}
          height={compact ? 28 : 32}
          unoptimized
          className={`${compact ? "size-7" : "size-8"} rounded-md object-cover ring-1 ring-border`}
        />
      ) : (
        <div className={`${compact ? "size-7" : "size-8"} rounded-md bg-primary/20 ring-1 ring-border`} />
      )}
      {!compact ? <p className="text-sm font-semibold tracking-tight">{brandName}</p> : null}
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
            <BrandMark
              brandName={t("brandName")}
              logoUrl={themeOverrides?.logoUrl}
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
