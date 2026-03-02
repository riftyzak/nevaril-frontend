import { getTranslations } from "next-intl/server"

import { PublicShell } from "@/components/layout/public-shell"
import { type AppLocale } from "@/i18n/locales"
import { BookingProgress } from "@/features/booking/progress"
import { ServiceDetail } from "@/features/booking/service-detail"
import { parseBookingState } from "@/features/booking/state"
import { tenantUrl } from "@/lib/tenant/tenant-url"

export default async function ServiceDetailPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ locale: AppLocale; tenantSlug: string; serviceId: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}>) {
  const { locale, tenantSlug, serviceId } = await params
  const state = parseBookingState(await searchParams)
  const t = await getTranslations({ locale, namespace: "booking" })

  return (
    <PublicShell homeHref={tenantUrl({ locale, tenantSlug })} locale={locale}>
      <BookingProgress
        current="service"
        labels={{
          service: t("progress.service"),
          slot: t("progress.slot"),
          details: t("progress.details"),
          confirm: t("progress.confirm"),
        }}
      />
      <ServiceDetail
        locale={locale}
        tenantSlug={tenantSlug}
        serviceId={serviceId}
        initialVariant={state.variant}
        initialStaffId={state.staffId}
        t={{
          loading: t("detail.loading"),
          notFound: t("detail.notFound"),
          backToCatalog: t("detail.backToCatalog"),
          chooseVariant: t("detail.chooseVariant"),
          chooseStaff: t("detail.chooseStaff"),
          anyStaff: t("detail.anyStaff"),
          continueToSlots: t("detail.continueToSlots"),
          photosPlaceholder: t("detail.photosPlaceholder"),
          durationUnit: t("durationUnit"),
        }}
      />
    </PublicShell>
  )
}
