import { redirect } from "next/navigation"

import { AdminShell } from "@/components/layout/admin-shell"
import { BookingDetailPanel } from "@/features/admin/admin-pages"
import type { AppLocale } from "@/i18n/locales"
import { getTenantConfig, listBookings } from "@/lib/app/client"
import { getAdminPageContext } from "@/lib/auth/admin-page"
import { can } from "@/lib/auth/permissions"
import { localePath } from "@/lib/tenant/tenant-url"

export default async function AdminBookingDetailPage({
  params,
}: Readonly<{
  params: Promise<{ locale: AppLocale; tenantSlug: string; bookingId: string }>
}>) {
  const { locale, tenantSlug, bookingId } = await params
  const { session, tenantSettings, navItems } = await getAdminPageContext({
    locale,
    tenantSlug,
    module: "bookings",
    ability: "view",
  })
  const bookingsResult = await listBookings(tenantSlug)
  const booking = bookingsResult.ok
    ? bookingsResult.data.find((item) => item.id === bookingId)
    : undefined
  const allowed = can(
    session,
    "bookings",
    "view",
    { assignedStaffId: booking?.staffId },
    tenantSettings
  )
  if (!allowed) {
    redirect(localePath({ locale, path: "/not-authorized" }))
  }

  const tenantConfig = await getTenantConfig(tenantSlug)
  const tz = tenantConfig.ok ? tenantConfig.data.timezone : "Europe/Prague"

  return (
    <AdminShell locale={locale} navItems={navItems} session={session} tenantSettings={tenantSettings}>
      <BookingDetailPanel
        locale={locale}
        tenantSlug={tenantSlug}
        bookingId={bookingId}
        session={session}
        tenantSettings={tenantSettings}
        tz={tz}
      />
    </AdminShell>
  )
}
