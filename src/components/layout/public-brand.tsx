"use client"

import { useTranslations } from "next-intl"

import { useTenantConfig } from "@/lib/query/hooks/use-tenant-config"

export function PublicBrand({
  tenantSlug,
  brandNameFallback,
  logoUrlOverride,
  compact = false,
}: Readonly<{
  tenantSlug?: string
  brandNameFallback: string
  logoUrlOverride?: string
  compact?: boolean
}>) {
  const t = useTranslations("shell.public")
  const tenantConfigQuery = useTenantConfig(tenantSlug ?? "")
  const brandName = tenantConfigQuery.data?.tenantName ?? brandNameFallback
  const logoUrl = logoUrlOverride ?? tenantConfigQuery.data?.logoUrl
  const loadFailed = tenantConfigQuery.isError && Boolean(tenantSlug)

  return (
    <div className="flex items-center gap-2" title={loadFailed ? t("brandLoadFailed") : undefined}>
      {logoUrl ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={logoUrl}
          alt={brandName}
          className={`${compact ? "size-7" : "size-8"} rounded-md object-cover ring-1 ring-border`}
        />
      ) : (
        <div className={`${compact ? "size-7" : "size-8"} rounded-md bg-primary/20 ring-1 ring-border`} />
      )}
      {!compact ? (
        <div className="grid gap-0.5">
          <p className={`text-sm font-semibold tracking-tight ${loadFailed ? "text-destructive" : ""}`}>
            {brandName}
          </p>
          {loadFailed ? <p className="text-[11px] text-destructive">{t("brandLoadFailed")}</p> : null}
        </div>
      ) : null}
    </div>
  )
}
