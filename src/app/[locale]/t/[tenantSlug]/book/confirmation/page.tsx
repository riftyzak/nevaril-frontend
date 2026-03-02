import { getTranslations } from "next-intl/server"

import { PublicShell } from "@/components/layout/public-shell"
import { Confirmation } from "@/features/booking/confirmation"
import { BookingProgress } from "@/features/booking/progress"
import { type AppLocale } from "@/i18n/locales"
import { tenantUrl } from "@/lib/tenant/tenant-url"

export default async function ConfirmationPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ locale: AppLocale; tenantSlug: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}>) {
  const { locale, tenantSlug } = await params
  const query = await searchParams
  const tokenParam = query.token
  const serviceParam = query.serviceId
  const token = Array.isArray(tokenParam) ? tokenParam[0] : tokenParam
  const serviceId = Array.isArray(serviceParam) ? serviceParam[0] : serviceParam

  const t = await getTranslations({ locale, namespace: "booking" })

  return (
    <PublicShell homeHref={tenantUrl({ locale, tenantSlug })} locale={locale}>
      <BookingProgress
        current="confirm"
        labels={{
          service: t("progress.service"),
          slot: t("progress.slot"),
          details: t("progress.details"),
          confirm: t("progress.confirm"),
        }}
      />
      <Confirmation
        locale={locale}
        tenantSlug={tenantSlug}
        token={token}
        serviceId={serviceId}
        t={{
          missingToken: t("confirm.missingToken"),
          loading: t("confirm.loading"),
          notFound: t("confirm.notFound"),
          title: t("confirm.title"),
          description: t("confirm.description"),
          service: t("confirm.service"),
          variant: t("confirm.variant"),
          durationUnit: t("durationUnit"),
          staff: t("confirm.staff"),
          date: t("confirm.date"),
          customer: t("confirm.customer"),
          addToCalendar: t("confirm.addToCalendar"),
          newBooking: t("confirm.newBooking"),
          noStaff: t("common.noStaff"),
        }}
      />
    </PublicShell>
  )
}
