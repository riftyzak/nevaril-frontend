"use client"

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
  const tenantConfigQuery = useTenantConfig(tenantSlug ?? "")
  const brandName = tenantConfigQuery.data?.tenantName ?? brandNameFallback
  const logoUrl = logoUrlOverride ?? tenantConfigQuery.data?.logoUrl

  return (
    <div className="flex items-center gap-2">
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
      {!compact ? <p className="text-sm font-semibold tracking-tight">{brandName}</p> : null}
    </div>
  )
}
