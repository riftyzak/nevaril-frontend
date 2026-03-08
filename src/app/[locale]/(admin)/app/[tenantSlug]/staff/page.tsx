import { AdminShell } from "@/components/layout/admin-shell"
import { StaffPanel } from "@/features/admin/admin-pages"
import type { AppLocale } from "@/i18n/locales"
import { getTenantTimezone } from "@/lib/app/server"
import { getAdminPageContext } from "@/lib/auth/admin-page"

export default async function AdminStaffPage({
  params,
}: Readonly<{
  params: Promise<{ locale: AppLocale; tenantSlug: string }>
}>) {
  const { locale, tenantSlug } = await params
  const { session, tenantSettings, navItems } = await getAdminPageContext({
    locale,
    tenantSlug,
    module: "staff",
    ability: "view",
  })
  const tz = await getTenantTimezone(tenantSlug)

  return (
    <AdminShell locale={locale} navItems={navItems} session={session} tenantSettings={tenantSettings}>
      <StaffPanel
        locale={locale}
        tenantSlug={tenantSlug}
        session={session}
        tenantSettings={tenantSettings}
        tz={tz}
      />
    </AdminShell>
  )
}
