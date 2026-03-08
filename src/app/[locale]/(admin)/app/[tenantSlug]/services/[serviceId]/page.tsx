import { AdminShell } from "@/components/layout/admin-shell"
import { ServiceDetailPanel } from "@/features/admin/admin-pages"
import type { AppLocale } from "@/i18n/locales"
import { getTenantConfig } from "@/lib/app/client"
import { getAdminPageContext } from "@/lib/auth/admin-page"

export default async function AdminServiceDetailPage({
  params,
}: Readonly<{
  params: Promise<{ locale: AppLocale; tenantSlug: string; serviceId: string }>
}>) {
  const { locale, tenantSlug, serviceId } = await params
  const { session, tenantSettings, navItems } = await getAdminPageContext({
    locale,
    tenantSlug,
    module: "services",
    ability: "view",
  })
  const tenantConfig = await getTenantConfig(tenantSlug)
  const tz = tenantConfig.ok ? tenantConfig.data.timezone : "Europe/Prague"

  return (
    <AdminShell locale={locale} navItems={navItems} session={session} tenantSettings={tenantSettings}>
      <ServiceDetailPanel
        locale={locale}
        tenantSlug={tenantSlug}
        serviceId={serviceId}
        session={session}
        tenantSettings={tenantSettings}
        tz={tz}
      />
    </AdminShell>
  )
}
