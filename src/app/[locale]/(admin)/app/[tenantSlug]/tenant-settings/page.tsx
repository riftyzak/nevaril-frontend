import { AdminShell } from "@/components/layout/admin-shell"
import { TenantSettingsPanel } from "@/features/admin/tenant-settings-panel"
import type { AppLocale } from "@/i18n/locales"
import { getAdminPageContext } from "@/lib/auth/admin-page"

export default async function AdminTenantSettingsPage({
  params,
}: Readonly<{
  params: Promise<{ locale: AppLocale; tenantSlug: string }>
}>) {
  const { locale, tenantSlug } = await params
  const { session, tenantSettings, navItems } = await getAdminPageContext({
    locale,
    tenantSlug,
    module: "tenantSettings",
    ability: "view",
  })

  return (
    <AdminShell locale={locale} navItems={navItems} session={session} tenantSettings={tenantSettings}>
      <TenantSettingsPanel locale={locale} tenantSlug={tenantSlug} />
    </AdminShell>
  )
}
