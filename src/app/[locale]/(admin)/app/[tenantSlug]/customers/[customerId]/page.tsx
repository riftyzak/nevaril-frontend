import { redirect } from "next/navigation"

import { AdminShell } from "@/components/layout/admin-shell"
import { CustomerDetailPanel } from "@/features/admin/admin-pages"
import type { AppLocale } from "@/i18n/locales"
import { getAdminPageContext } from "@/lib/auth/admin-page"
import { can } from "@/lib/auth/permissions"
import { localePath } from "@/lib/tenant/tenant-url"
import { getDb } from "@/lib/mock/storage"

export default async function AdminCustomerDetailPage({
  params,
}: Readonly<{
  params: Promise<{ locale: AppLocale; tenantSlug: string; customerId: string }>
}>) {
  const { locale, tenantSlug, customerId } = await params
  const { session, tenantSettings, navItems } = await getAdminPageContext({
    locale,
    tenantSlug,
    module: "customers",
    ability: "view",
  })

  const tenant = getDb().tenants[tenantSlug]
  const customerStaffIds = tenant?.bookings
    .filter((item) => item.customerId === customerId)
    .map((item) => item.staffId ?? null) ?? [null]
  const allowed = can(
    session,
    "customers",
    "view",
    { assignedStaffIds: customerStaffIds },
    tenantSettings
  )

  if (!allowed) {
    redirect(localePath({ locale, path: "/not-authorized" }))
  }

  const tz = tenant?.config.timezone ?? "Europe/Prague"

  return (
    <AdminShell locale={locale} navItems={navItems} session={session} tenantSettings={tenantSettings}>
      <CustomerDetailPanel
        locale={locale}
        tenantSlug={tenantSlug}
        customerId={customerId}
        session={session}
        tenantSettings={tenantSettings}
        tz={tz}
      />
    </AdminShell>
  )
}
