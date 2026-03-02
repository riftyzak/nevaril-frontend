import { getTranslations } from "next-intl/server"

import { PublicShell } from "@/components/layout/public-shell"
import { type AppLocale } from "@/i18n/locales"
import { PublicWaitlistForm } from "@/features/waitlist/public-waitlist-form"
import { tenantUrl } from "@/lib/tenant/tenant-url"

export default async function WaitlistPublicPage({
  params,
}: Readonly<{
  params: Promise<{ locale: AppLocale; tenantSlug: string }>
}>) {
  const { locale, tenantSlug } = await params
  const t = await getTranslations({ locale, namespace: "waitlist.public" })

  return (
    <PublicShell homeHref={tenantUrl({ locale, tenantSlug })} locale={locale}>
      <PublicWaitlistForm
        tenantSlug={tenantSlug}
        t={{
          title: t("title"),
          description: t("description"),
          service: t("service"),
          date: t("date"),
          timeWindow: t("timeWindow"),
          note: t("note"),
          name: t("name"),
          email: t("email"),
          phone: t("phone"),
          submit: t("submit"),
          submitLoading: t("submitLoading"),
          required: t("required"),
          invalidEmail: t("invalidEmail"),
          successTitle: t("successTitle"),
          successDescription: t("successDescription"),
          timeAny: t("timeAny"),
          timeMorning: t("timeMorning"),
          timeAfternoon: t("timeAfternoon"),
          timeEvening: t("timeEvening"),
          error: t("error"),
          servicePlaceholder: t("servicePlaceholder"),
        }}
      />
    </PublicShell>
  )
}
