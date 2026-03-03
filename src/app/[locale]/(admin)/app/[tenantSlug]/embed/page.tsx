import { headers } from "next/headers"
import { getTranslations } from "next-intl/server"

import { AdminShell } from "@/components/layout/admin-shell"
import { EmbedPanel } from "@/features/embed/embed-panel"
import type { AppLocale } from "@/i18n/locales"
import { getAdminPageContext } from "@/lib/auth/admin-page"
import type { TenantSource } from "@/lib/tenant/resolveTenant"

export default async function AdminEmbedPage({
  params,
}: Readonly<{
  params: Promise<{ locale: AppLocale; tenantSlug: string }>
}>) {
  const { locale, tenantSlug } = await params
  const t = await getTranslations({ locale, namespace: "embed" })
  const requestHeaders = await headers()
  const source = (requestHeaders.get("x-tenant-source") ?? "path") as TenantSource
  const host = requestHeaders.get("host") ?? "localhost:3000"
  const protocol = (requestHeaders.get("x-forwarded-proto") ?? "http") as "http" | "https"

  const { session, tenantSettings, navItems } = await getAdminPageContext({
    locale,
    tenantSlug,
    module: "bookings",
    ability: "view",
  })

  return (
    <AdminShell locale={locale} navItems={navItems} session={session} tenantSettings={tenantSettings}>
      <EmbedPanel
        locale={locale}
        tenantSlug={tenantSlug}
        source={source}
        host={host}
        protocol={protocol}
        t={{
          title: t("title"),
          description: t("description"),
          bookingEntry: t("bookingEntry"),
          serviceLink: t("serviceLink"),
          chooseService: t("chooseService"),
          copyUrl: t("copyUrl"),
          copied: t("copied"),
          widgetTitle: t("widgetTitle"),
          widgetDescription: t("widgetDescription"),
          primary: t("primary"),
          radius: t("radius"),
          logoUrl: t("logoUrl"),
          iframeSnippet: t("iframeSnippet"),
          copySnippet: t("copySnippet"),
        }}
      />
    </AdminShell>
  )
}
