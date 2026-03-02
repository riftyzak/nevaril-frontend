"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"

import { APP_LOCALES, type AppLocale } from "@/i18n/locales"
import {
  getTenantFromPath,
  stripLocalePrefix,
  stripTenantPrefix,
} from "@/lib/tenant/resolveTenant"
import { useTenant } from "@/lib/tenant/tenant-provider"
import { localePath, tenantPathToSubdomainPath, tenantUrl } from "@/lib/tenant/tenant-url"
import { cn } from "@/lib/utils"

export function LocaleSwitcher() {
  const t = useTranslations("localeSwitcher")
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { locale, tenantSlug, source } = useTenant()

  const queryString = searchParams.toString()

  return (
    <nav aria-label={t("ariaLabel")} className="flex items-center gap-1 rounded-full border border-border p-1">
      {APP_LOCALES.map((nextLocale) => {
        const hasTenantInPath = Boolean(getTenantFromPath(pathname))
        const relativePath =
          source === "subdomain"
            ? hasTenantInPath
              ? stripTenantPrefix(pathname)
              : stripLocalePrefix(pathname)
            : stripTenantPrefix(pathname)
        const isStandaloneManagePath = relativePath === "/m" || relativePath.startsWith("/m/")
        const isStandaloneAdminPath = relativePath === "/app" || relativePath.startsWith("/app/")
        const isStandalonePath = isStandaloneManagePath || isStandaloneAdminPath

        const canonicalPath = isStandalonePath
          ? localePath({
              locale: nextLocale as AppLocale,
              path: relativePath,
            })
          : tenantUrl({
              locale: nextLocale as AppLocale,
              tenantSlug,
              path: relativePath,
            })
        const hrefPath =
          source === "subdomain"
            ? tenantPathToSubdomainPath(canonicalPath)
            : canonicalPath
        const href = queryString ? `${hrefPath}?${queryString}` : hrefPath

        const active = locale === nextLocale

        return (
          <Link
            key={nextLocale}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-medium uppercase transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {nextLocale}
          </Link>
        )
      })}
    </nav>
  )
}
