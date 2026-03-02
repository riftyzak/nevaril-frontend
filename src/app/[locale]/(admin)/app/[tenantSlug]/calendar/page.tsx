import { AdminShell } from "@/components/layout/admin-shell"
import { CalendarPanel } from "@/features/admin/admin-pages"
import type { AppLocale } from "@/i18n/locales"
import { getAdminPageContext } from "@/lib/auth/admin-page"
import { getDb } from "@/lib/mock/storage"

export default async function AdminCalendarPage({
  params,
}: Readonly<{
  params: Promise<{ locale: AppLocale; tenantSlug: string }>
}>) {
  const { locale, tenantSlug } = await params
  const { session, tenantSettings, navItems } = await getAdminPageContext({
    locale,
    tenantSlug,
    module: "calendar",
    ability: "view",
  })
  const tz = getDb().tenants[tenantSlug]?.config.timezone ?? "Europe/Prague"

  return (
    <AdminShell locale={locale} navItems={navItems} session={session} tenantSettings={tenantSettings}>
      <CalendarPanel
        locale={locale}
        tenantSlug={tenantSlug}
        session={session}
        tenantSettings={tenantSettings}
        tz={tz}
      />
    </AdminShell>
  )
}
