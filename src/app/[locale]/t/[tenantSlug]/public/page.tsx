import { getTranslations } from "next-intl/server"

import { PublicShell } from "@/components/layout/public-shell"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { type AppLocale } from "@/i18n/locales"
import { tenantUrl } from "@/lib/tenant/tenant-url"

export default async function PublicDemoPage({
  params,
}: Readonly<{
  params: Promise<{ locale: AppLocale; tenantSlug: string }>
}>) {
  const { locale, tenantSlug } = await params
  const t = await getTranslations({ locale, namespace: "publicDemo" })

  return (
    <PublicShell homeHref={tenantUrl({ locale, tenantSlug })} locale={locale}>
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>{t("title")}</CardTitle>
            <CardDescription>{t("description")}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-muted-foreground">
            <p>{t("tenantLine", { tenantSlug })}</p>
            <p>{t("routingLine")}</p>
          </CardContent>
        </Card>
      </div>
    </PublicShell>
  )
}
