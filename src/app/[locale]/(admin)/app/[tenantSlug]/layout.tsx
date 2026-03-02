import { headers } from "next/headers"
import { notFound } from "next/navigation"
import type { ReactNode } from "react"

import { isSupportedLocale, type TenantSource } from "@/lib/tenant/resolveTenant"
import { TenantProvider } from "@/lib/tenant/tenant-provider"

export default async function AdminTenantLayout({
  children,
  params,
}: Readonly<{
  children: ReactNode
  params: Promise<{ locale: string; tenantSlug: string }>
}>) {
  const { locale, tenantSlug } = await params
  if (!isSupportedLocale(locale)) {
    notFound()
  }

  const requestHeaders = await headers()
  const source = (requestHeaders.get("x-tenant-source") ?? "path") as TenantSource

  return <TenantProvider value={{ tenantSlug, locale, source }}>{children}</TenantProvider>
}
