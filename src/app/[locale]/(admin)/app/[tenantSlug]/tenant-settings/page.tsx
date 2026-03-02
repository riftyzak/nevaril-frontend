import { getTranslations } from "next-intl/server"

import { AdminShell } from "@/components/layout/admin-shell"
import { OwnerOnlyPlaceholder } from "@/features/admin/admin-pages"
import type { AppLocale } from "@/i18n/locales"
import { getAdminPageContext } from "@/lib/auth/admin-page"

export default async function AdminTenantSettingsPage({
  params,
}: Readonly<{
  params: Promise<{ locale: AppLocale; tenantSlug: string }>
}>) {
  const { locale, tenantSlug } = await params
  const t = await getTranslations({ locale, namespace: "adminCore" })
  const { session, tenantSettings, navItems } = await getAdminPageContext({
    locale,
    tenantSlug,
    module: "tenantSettings",
    ability: "view",
  })

  return (
    <AdminShell locale={locale} navItems={navItems} session={session} tenantSettings={tenantSettings}>
      <OwnerOnlyPlaceholder
        title={t("ownerOnly.tenantSettingsTitle")}
        description={t("ownerOnly.tenantSettingsDescription")}
        body={t("ownerOnly.body")}
      />
    </AdminShell>
  )
}
