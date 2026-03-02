import { redirect } from "next/navigation"

import type { AppLocale } from "@/i18n/locales"
import { adminAppPath } from "@/lib/tenant/tenant-url"

export default async function AdminTenantIndexPage({
  params,
}: Readonly<{
  params: Promise<{ locale: AppLocale; tenantSlug: string }>
}>) {
  const { locale, tenantSlug } = await params
  redirect(adminAppPath({ locale, tenantSlug, path: "/dashboard" }))
}
