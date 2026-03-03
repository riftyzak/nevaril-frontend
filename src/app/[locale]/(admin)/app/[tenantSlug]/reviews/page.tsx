import { AdminShell } from "@/components/layout/admin-shell"
import { ReviewsPanel } from "@/features/admin/advanced-pages"
import type { AppLocale } from "@/i18n/locales"
import { getAdminPageContext } from "@/lib/auth/admin-page"
import { requirePlanAccess } from "@/lib/auth/route-guard"
import { PLAN_FEATURES } from "@/lib/plans/features"

export default async function AdminReviewsPage({
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
    feature: PLAN_FEATURES.REVIEWS,
    session,
  })

  return (
    <AdminShell locale={locale} navItems={navItems} session={session} tenantSettings={tenantSettings}>
      <ReviewsPanel />
    </AdminShell>
  )
}
