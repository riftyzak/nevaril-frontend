import { redirect } from "next/navigation"

import { AdminShell } from "@/components/layout/admin-shell"
import { BookingDetailPanel } from "@/features/admin/admin-pages"
import type { AppLocale } from "@/i18n/locales"
import { getAdminPageContext } from "@/lib/auth/admin-page"
import { can } from "@/lib/auth/permissions"
import { localePath } from "@/lib/tenant/tenant-url"
import { getDb } from "@/lib/mock/storage"

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
  const tenant = getDb().tenants[tenantSlug]
  const booking = tenant?.bookings.find((item) => item.id === bookingId)
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

  const tz = tenant?.config.timezone ?? "Europe/Prague"

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
