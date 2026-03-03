import Link from "next/link"
import { getTranslations } from "next-intl/server"

import { AdminShell } from "@/components/layout/admin-shell"
import type { AppLocale } from "@/i18n/locales"
import { getAdminPageContext } from "@/lib/auth/admin-page"
import { adminAppPath } from "@/lib/tenant/tenant-url"

export default async function PlanLockedPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ locale: AppLocale; tenantSlug: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}>) {
  const { locale, tenantSlug } = await params
  const query = await searchParams
  const requiredPlanRaw = query.requiredPlan
  const requiredPlan = Array.isArray(requiredPlanRaw) ? requiredPlanRaw[0] : requiredPlanRaw
  const t = await getTranslations({ locale, namespace: "planLocked" })
  const { session, tenantSettings, navItems } = await getAdminPageContext({
    locale,
    tenantSlug,
    module: "bookings",
    ability: "view",
  })

  return (
    <AdminShell locale={locale} navItems={navItems} session={session} tenantSettings={tenantSettings}>
      <section data-testid="locked-plan-screen" className="max-w-xl rounded-xl border border-border bg-card p-6">
        <h1 className="text-xl font-semibold">{t("title")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("description", { requiredPlan: (requiredPlan ?? "business").toUpperCase() })}
        </p>
        <div className="mt-4 flex gap-2">
          <Link
            href={`/${locale}/pricing`}
            className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
          >
            {t("upgrade")}
          </Link>
          <Link
            href={adminAppPath({ locale, tenantSlug, path: "/dashboard" })}
            className="inline-flex h-9 items-center rounded-md border border-border px-4 text-sm"
          >
            {t("back")}
          </Link>
        </div>
      </section>
    </AdminShell>
  )
}
