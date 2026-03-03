import { AdminShell } from "@/components/layout/admin-shell"
import { LoyaltyPanel } from "@/features/admin/advanced-pages"
import type { AppLocale } from "@/i18n/locales"
import { getAdminPageContext } from "@/lib/auth/admin-page"
import { requirePlanAccess } from "@/lib/auth/route-guard"
import { PLAN_FEATURES } from "@/lib/plans/features"

export default async function AdminLoyaltyPage({
  params,
}: Readonly<{
  params: Promise<{ locale: AppLocale; tenantSlug: string }>
}>) {
  const { locale, tenantSlug } = await params
  const { session, tenantSettings, navItems } = await getAdminPageContext({
    locale,
    tenantSlug,
    module: "bookings",
    ability: "view",
  })
  requirePlanAccess({
    locale,
    tenantSlug,
    feature: PLAN_FEATURES.LOYALTY,
    session,
  })

  return (
    <AdminShell locale={locale} navItems={navItems} session={session} tenantSettings={tenantSettings}>
      <LoyaltyPanel tenantSlug={tenantSlug} />
    </AdminShell>
  )
}
