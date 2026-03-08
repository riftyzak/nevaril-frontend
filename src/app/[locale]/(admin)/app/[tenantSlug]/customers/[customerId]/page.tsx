import { redirect } from "next/navigation"

import { AdminShell } from "@/components/layout/admin-shell"
import { CustomerDetailPanel } from "@/features/admin/admin-pages"
import type { AppLocale } from "@/i18n/locales"
import { getTenantTimezone, listTenantBookings } from "@/lib/app/server"
import { getAdminPageContext } from "@/lib/auth/admin-page"
import { can } from "@/lib/auth/permissions"
import { localePath } from "@/lib/tenant/tenant-url"

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

  const bookings = await listTenantBookings(tenantSlug)
  const customerStaffIds =
    bookings.filter((item) => item.customerId === customerId).map((item) => item.staffId ?? null)
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

  const tz = await getTenantTimezone(tenantSlug)

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
