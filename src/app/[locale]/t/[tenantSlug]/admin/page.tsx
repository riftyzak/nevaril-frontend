import { getTranslations } from "next-intl/server"

import { AdminShell } from "@/components/layout/admin-shell"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { type AppLocale } from "@/i18n/locales"
import { tenantUrl } from "@/lib/tenant/tenant-url"

export default async function AdminDemoPage({
  params,
}: Readonly<{
  params: Promise<{ locale: AppLocale; tenantSlug: string }>
}>) {
  const { locale, tenantSlug } = await params
  const t = await getTranslations({ locale, namespace: "adminDemo" })

  return (
    <AdminShell
      locale={locale}
      navItems={[
        { href: tenantUrl({ locale, tenantSlug, path: "/admin" }), key: "dashboard" },
        { href: tenantUrl({ locale, tenantSlug, path: "/admin" }), key: "calendar" },
        { href: tenantUrl({ locale, tenantSlug, path: "/admin" }), key: "bookings" },
        { href: tenantUrl({ locale, tenantSlug, path: "/admin" }), key: "customers" },
        { href: tenantUrl({ locale, tenantSlug, path: "/admin" }), key: "settings" },
      ]}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("cardDashboardTitle")}</CardTitle>
            <CardDescription>{t("cardDashboardDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {t("cardDashboardBody")}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("cardModulesTitle")}</CardTitle>
            <CardDescription>{t("cardModulesDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {t("cardModulesBody")}
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  )
}
